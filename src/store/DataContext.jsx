import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { getSocket } from '../lib/socket';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { user, role, isAuthenticated } = useAuth();

  const [complaints, setComplaints] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
  });
  const [loading, setLoading] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  // Fetch authenticated user's isolated data from backend MongoDB Atlas
  const loadUserData = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setComplaints([]);
      setNotifications([]);
      setStats({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
      return;
    }

    setLoading(true);
    try {
      if (role === 'admin') {
        // Admin: Load authorized global complaints
        const [complaintsRes, analyticsRes, notifsRes] = await Promise.allSettled([
          api.getAdminComplaints(),
          api.getAnalytics(),
          api.getNotifications(),
        ]);

        if (complaintsRes.status === 'fulfilled' && complaintsRes.value?.success) {
          setComplaints(complaintsRes.value.data || []);
        }
        if (analyticsRes.status === 'fulfilled' && analyticsRes.value?.success) {
          const d = analyticsRes.value.data;
          setStats({
            total: d.total || 0,
            pending: d.pending || 0,
            inProgress: d.inProgress || 0,
            resolved: d.resolved || 0,
            ...d,
          });
        }
        if (notifsRes.status === 'fulfilled' && notifsRes.value?.success) {
          setNotifications(notifsRes.value.data || []);
        }
      } else if (role === 'officer') {
        // Officer: Load complaints assigned to this officer / department
        const [complaintsRes, notifsRes] = await Promise.allSettled([
          api.getOfficerComplaints(),
          api.getNotifications(),
        ]);

        if (complaintsRes.status === 'fulfilled' && complaintsRes.value?.success) {
          const list = complaintsRes.value.data || [];
          setComplaints(list);
          setStats({
            total: list.length,
            pending: list.filter(c => ['Submitted', 'Under Review', 'Assigned'].includes(c.status)).length,
            inProgress: list.filter(c => c.status === 'In Progress').length,
            resolved: list.filter(c => ['Resolved', 'Closed'].includes(c.status)).length,
          });
        }
        if (notifsRes.status === 'fulfilled' && notifsRes.value?.success) {
          setNotifications(notifsRes.value.data || []);
        }
      } else {
        // Citizen: STRICT USER ISOLATION — Query ONLY current authenticated citizen's complaints
        const [complaintsRes, statsRes, notifsRes] = await Promise.allSettled([
          api.getMyComplaints('limit=100'),
          api.getMyStats(),
          api.getNotifications(),
        ]);

        if (complaintsRes.status === 'fulfilled' && complaintsRes.value?.success) {
          setComplaints(complaintsRes.value.data || []);
        }
        if (statsRes.status === 'fulfilled' && statsRes.value?.success) {
          setStats(statsRes.value.data);
        }
        if (notifsRes.status === 'fulfilled' && notifsRes.value?.success) {
          setNotifications(notifsRes.value.data || []);
        }
      }
    } catch (error) {
      console.warn('Could not load user data from backend:', error.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, role]);

  // Reload data whenever authenticated user or role changes
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Setup Real-time Socket.IO synchronization with isolated rooms
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleConnect = () => {
      setIsLiveConnected(true);
      const token = localStorage.getItem('auth_token');
      if (token) {
        socket.emit('authenticate', token);
      }
    };

    const handleDisconnect = () => setIsLiveConnected(false);

    // Real-time Event: New complaint created
    const handleComplaintCreated = (payload) => {
      const newComplaint = payload?.complaint;
      if (!newComplaint) return;

      const currentUserId = user?._id?.toString() || user?.id?.toString();
      const complaintUserId = newComplaint.userId?.toString() || newComplaint.citizen?.id?.toString();

      // Ensure data isolation: citizen only adds if it belongs to them
      const isMyComplaint = currentUserId && complaintUserId === currentUserId;
      const isAuthorizedViewer = role === 'admin' || (role === 'officer' && newComplaint.department === user?.department);

      if (isMyComplaint || isAuthorizedViewer) {
        setComplaints(prev => {
          if (prev.some(c => c.id === newComplaint.id || (c._id && c._id === newComplaint._id))) {
            return prev;
          }
          return [newComplaint, ...prev];
        });

        // Update stats
        setStats(prev => ({
          ...prev,
          total: (prev.total || 0) + 1,
          pending: (prev.pending || 0) + 1,
        }));

        if (payload.notification) {
          setNotifications(prev => [payload.notification, ...prev]);
        }

        toast.info(`📢 Grievance Lodged: ${newComplaint.id}`, {
          description: `${newComplaint.category} · ${newComplaint.title.slice(0, 40)}...`,
        });
      }
    };

    // Real-time Event: Complaint deleted
    const handleComplaintDeleted = (payload) => {
      const deletedId = payload?.complaintId;
      const deletedMongoId = payload?._id;
      if (!deletedId && !deletedMongoId) return;

      setComplaints(prev => {
        const existing = prev.find(c => c.id === deletedId || c._id === deletedMongoId);
        if (!existing) return prev;

        // Recalculate stats decrements
        setStats(s => {
          const isPending = ['Submitted', 'Under Review'].includes(existing.status);
          const isInProgress = ['In Progress', 'Assigned'].includes(existing.status);
          const isResolved = ['Resolved', 'Closed'].includes(existing.status);

          return {
            ...s,
            total: Math.max(0, (s.total || 0) - 1),
            pending: isPending ? Math.max(0, (s.pending || 0) - 1) : s.pending,
            inProgress: isInProgress ? Math.max(0, (s.inProgress || 0) - 1) : s.inProgress,
            resolved: isResolved ? Math.max(0, (s.resolved || 0) - 1) : s.resolved,
          };
        });

        return prev.filter(c => c.id !== deletedId && c._id !== deletedMongoId);
      });

      toast.success(`🗑️ Complaint ${deletedId} deleted.`);
    };

    // Real-time Event: Status changed
    const handleStatusChanged = (payload) => {
      const { complaintId, status, complaint, notification, updatedBy } = payload;
      if (!complaintId) return;

      setComplaints(prev =>
        prev.map(c => {
          if (c.id === complaintId) {
            return complaint || {
              ...c,
              status,
              updatedDate: new Date().toISOString(),
              timeline: [
                ...(c.timeline || []),
                {
                  status,
                  date: new Date().toISOString(),
                  updatedBy: updatedBy || 'Officer',
                  remarks: `Status updated to ${status}.`,
                },
              ],
            };
          }
          return c;
        })
      );

      // Re-fetch accurate user stats
      if (isAuthenticated) {
        api.getMyStats().then(res => {
          if (res.success && res.data) setStats(res.data);
        }).catch(() => {});
      }

      if (notification) {
        setNotifications(prev => [notification, ...prev]);
      }

      toast.success(`⚡ Status Updated: ${complaintId}`, {
        description: `Marked as "${status}" by ${updatedBy || 'Department Officer'}.`,
      });
    };

    // Real-time Event: Notification
    const handleNewNotification = (notif) => {
      if (!notif) return;
      setNotifications(prev => [notif, ...prev]);
      toast.info(notif.title || 'New Notification', {
        description: notif.message,
      });
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('complaint:created', handleComplaintCreated);
    socket.on('new_grievance', handleComplaintCreated);
    socket.on('complaint:deleted', handleComplaintDeleted);
    socket.on('complaint:statusChanged', handleStatusChanged);
    socket.on('status_updated', handleStatusChanged);
    socket.on('notification:new', handleNewNotification);

    if (socket.connected) {
      setIsLiveConnected(true);
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('complaint:created', handleComplaintCreated);
      socket.off('new_grievance', handleComplaintCreated);
      socket.off('complaint:deleted', handleComplaintDeleted);
      socket.off('complaint:statusChanged', handleStatusChanged);
      socket.off('status_updated', handleStatusChanged);
      socket.off('notification:new', handleNewNotification);
    };
  }, [user, role, isAuthenticated]);

  // Action: Add Complaint (Creates on backend MongoDB Atlas)
  const addComplaint = useCallback(async (formData) => {
    const res = await api.createComplaint(formData);
    if (res.success && res.data) {
      setComplaints(prev => {
        if (prev.some(c => c.id === res.data.id)) return prev;
        return [res.data, ...prev];
      });
      setStats(prev => ({
        ...prev,
        total: (prev.total || 0) + 1,
        pending: (prev.pending || 0) + 1,
      }));
      return res.data;
    }
    throw new Error(res.message || 'Could not submit complaint');
  }, []);

  // Action: Delete Complaint (Deletes from backend MongoDB Atlas)
  const deleteComplaint = useCallback(async (id) => {
    const res = await api.deleteComplaint(id);
    if (res.success) {
      setComplaints(prev => {
        const item = prev.find(c => c.id === id || c._id === id);
        if (item) {
          setStats(s => ({
            ...s,
            total: Math.max(0, (s.total || 0) - 1),
            pending: ['Submitted', 'Under Review'].includes(item.status) ? Math.max(0, (s.pending || 0) - 1) : s.pending,
            inProgress: ['In Progress', 'Assigned'].includes(item.status) ? Math.max(0, (s.inProgress || 0) - 1) : s.inProgress,
            resolved: ['Resolved', 'Closed'].includes(item.status) ? Math.max(0, (s.resolved || 0) - 1) : s.resolved,
          }));
        }
        return prev.filter(c => c.id !== id && c._id !== id);
      });
      return true;
    }
    throw new Error(res.message || 'Could not delete complaint');
  }, []);

  // Action: Update complaint status
  const updateStatus = useCallback(async (id, status, remarks = '', officerName = 'Officer') => {
    const res = await api.updateComplaintStatus(id, { status, remarks, officerName });
    if (res.success && res.data) {
      setComplaints(prev => prev.map(c => (c.id === id || c._id === id ? res.data : c)));
      return res.data;
    }
    throw new Error(res.message || 'Could not update status');
  }, []);

  // Action: Mark notification as read
  const markNotificationAsRead = useCallback(async (notifId) => {
    try {
      await api.markNotificationRead(notifId);
      setNotifications(prev =>
        prev.map(n => (n._id === notifId || n.id === notifId ? { ...n, read: true } : n))
      );
    } catch (e) {
      console.warn('Could not mark notification read:', e.message);
    }
  }, []);

  // Action: Mark all notifications as read
  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.warn('Could not mark all notifications read:', e.message);
    }
  }, []);

  return (
    <DataContext.Provider
      value={{
        complaints,
        notifications,
        stats,
        loading,
        isLiveConnected,
        loadUserData,
        addComplaint,
        deleteComplaint,
        updateStatus,
        markNotificationAsRead,
        markAllNotificationsAsRead,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

export default DataContext;
