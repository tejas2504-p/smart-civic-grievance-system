import cron from 'node-cron';
import Complaint from '../models/Complaint.js';
import SLARule from '../models/SLARule.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';

// Idempotent escalation helper
const ESCALATION_LEVELS = [
  { level: 1, role: 'department_head', title: 'Department Head' },
  { level: 2, role: 'admin', title: 'Senior Authority / Admin' },
];

export function initSLACron(io) {
  // Run every 10 minutes
  cron.schedule('*/10 * * * *', async () => {
    try {
      console.log('⏳ [SLA Cron] Starting SLA check...');
      
      const now = new Date();
      
      // Fetch active/approaching complaints that have a deadline
      const activeComplaints = await Complaint.find({
        slaState: { $in: ['ACTIVE', 'APPROACHING_DEADLINE'] },
        slaDeadline: { $exists: true, $ne: null }
      });

      for (const complaint of activeComplaints) {
        // Fetch the corresponding SLA Rule for the complaint's priority
        let rule = await SLARule.findOne({ priority: complaint.priority });
        if (!rule) {
          // fallback if no rule configured
          rule = { warningHoursBefore: 4 };
        }

        const msRemaining = complaint.slaDeadline.getTime() - now.getTime();
        const hoursRemaining = msRemaining / (1000 * 60 * 60);

        // 1. BREACH CHECK
        if (hoursRemaining <= 0) {
          console.log(`🚨 [SLA Cron] Breach detected for ${complaint.id}`);
          
          complaint.slaState = 'BREACHED';
          complaint.escalationLevel = (complaint.escalationLevel || 0) + 1;
          
          // Determine who to escalate to
          const escalationTarget = ESCALATION_LEVELS.find(e => e.level === complaint.escalationLevel) || ESCALATION_LEVELS[ESCALATION_LEVELS.length - 1];
          complaint.escalatedTo = escalationTarget.role;
          complaint.status = 'Escalated';

          // Add to timeline
          complaint.timeline.push({
            status: 'Escalated',
            date: now,
            updatedBy: 'System',
            role: 'system',
            remarks: `SLA Breached. Escalated to ${escalationTarget.title}.`
          });

          await complaint.save();

          // Audit Log
          await AuditLog.create({
            action: 'SLA_BREACH',
            performedBy: 'System',
            details: `Complaint ${complaint.id} breached SLA. Escalated to ${escalationTarget.title}.`,
            ipAddress: '127.0.0.1'
          });

          // Notification to Officer
          await Notification.create({
            userId: complaint.assignedOfficer?.id || 'officer_all',
            role: 'officer',
            complaintId: complaint.id,
            title: 'SLA Breached',
            message: `Your assigned complaint ${complaint.id} has breached its SLA and is now escalated.`,
            type: 'sla_breach'
          });

          // Notification to Escalated Role (Dept Head / Admin)
          const notif = await Notification.create({
            userId: 'officer_all', // Should realistically target specific dept head, but for demo targeting all officers
            role: escalationTarget.role,
            complaintId: complaint.id,
            title: 'Complaint Escalated to You',
            message: `Complaint ${complaint.id} has breached SLA and has been escalated to your level.`,
            type: 'escalation'
          });

          // Live WebSocket Update
          if (io) {
            io.to(`complaint_${complaint.id}`).emit('status_updated', complaint);
            if (complaint.citizen?.id) {
              io.to(`user_${complaint.citizen.id}`).emit('new_notification', {
                title: 'Complaint Escalated',
                message: `Your complaint ${complaint.id} has been automatically escalated due to delays.`,
                createdAt: now
              });
            }
          }
        } 
        // 2. WARNING CHECK
        else if (hoursRemaining <= rule.warningHoursBefore && complaint.slaState === 'ACTIVE') {
          console.log(`⚠️ [SLA Cron] Warning for ${complaint.id}. ${hoursRemaining.toFixed(1)} hours left.`);
          
          complaint.slaState = 'APPROACHING_DEADLINE';
          await complaint.save();

          // Audit Log
          await AuditLog.create({
            action: 'SLA_WARNING',
            performedBy: 'System',
            details: `Complaint ${complaint.id} is approaching SLA deadline.`,
            ipAddress: '127.0.0.1'
          });

          // Notify Officer
          if (complaint.assignedOfficer?.id) {
            const notif = await Notification.create({
              userId: complaint.assignedOfficer.id,
              role: 'officer',
              complaintId: complaint.id,
              title: 'SLA Warning',
              message: `Complaint ${complaint.id} is approaching its SLA deadline. Please resolve it soon.`,
              type: 'sla_warning'
            });

            if (io) {
              io.to(`user_${complaint.assignedOfficer.id}`).emit('new_notification', notif);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ [SLA Cron] Error executing SLA check:', error);
    }
  });
}
