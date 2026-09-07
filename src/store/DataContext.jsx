import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { getSocket } from '../lib/socket';
import { api } from '../lib/api';
import { complaints as initialComplaints, notifications as initialNotifs, publicStats } from '../data/mockData';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [complaints, setComplaints] = useState(() => {
    const saved = localStorage.getItem('portal_complaints');
    return saved ? JSON.parse(saved) : initialComplaints;
  });

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('portal_notifications');
    return saved ? JSON.parse(saved) : initialNotifs;
  });

  const [stats, setStats] = useState(publicStats);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('portal_complaints', JSON.stringify(complaints));
  }, [complaints]);

  useEffect(() => {
    localStorage.setItem('portal_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Try loading from Backend Server on mount
  useEffect(() => {
    async function loadBackendData() {
      try {
        const res = await api.getComplaints();
        if (res.success && Array.isArray(res.data)) {
          setComplaints(res.data);
        }
      } catch (err) {
        // Fallback to local / mock data quietly
      }


      try {
        const analyticsRes = await api.getAnalytics();
        if (analyticsRes.success && analyticsRes.data) {
          setStats(s => ({ ...s, ...analyticsRes.data }));
        }
      } catch (err) {
        // fallback
      }
    }

    loadBackendData();
  }, []);

  // Setup Socket.IO real-time listeners
  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => setIsLiveConnected(true);
    const handleDisconnect = () => setIsLiveConnected(false);

    const handleNewGrievance = (payload) => {
      console.log('📡 [Real-time Event] New grievance received:', payload);
      const newComplaint = payload.complaint;
      if (!newComplaint) return;

      setComplaints(prev => {
        if (prev.some(c => c.id === newComplaint.id)) return prev;
        return [newComplaint, ...prev];
      });

      if (payload.notification) {
        setNotifications(prev => [payload.notification, ...prev]);
      }

      toast.info(`📢 New Grievance Lodged: ${newComplaint.id}`, {
        description: `${newComplaint.department} · ${newComplaint.title.slice(0, 45)}...`,
        duration: 5000,
      });
    };

    const handleStatusUpdated = (payload) => {
      console.log('📡 [Real-time Event] Status updated:', payload);
      const { complaintId, status, complaint, notification, updatedBy } = payload;

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

      if (notification) {
        setNotifications(prev => [notification, ...prev]);
      }

      toast.success(`⚡ Status Updated: ${complaintId}`, {
        description: `Marked as "${status}" by ${updatedBy || 'Department Officer'}.`,
        duration: 6000,
      });
    };

    const handleRemarkAdded = (payload) => {
      const { complaintId, remarks, updatedBy } = payload;
      setComplaints(prev =>
        prev.map(c => {
          if (c.id === complaintId) {
            return {
              ...c,
              timeline: [
                ...(c.timeline || []),
                {
                  status: c.status,
                  date: new Date().toISOString(),
                  updatedBy,
                  remarks,
                },
              ],
            };
          }
          return c;
        })
      );
      toast.info(`💬 New Official Remark on ${complaintId}`, {
        description: `"${remarks.slice(0, 50)}..."`,
      });
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('new_grievance', handleNewGrievance);
    socket.on('status_updated', handleStatusUpdated);
    socket.on('remark_added', handleRemarkAdded);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('new_grievance', handleNewGrievance);
      socket.off('status_updated', handleStatusUpdated);
      socket.off('remark_added', handleRemarkAdded);
    };
  }, []);

  // Action: Add new complaint (Syncs to API + Local fallback + Socket broadcast)
  const addComplaint = useCallback(async (newComplaintData) => {
    const tempId = `MH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const formatted = {
      id: tempId,
      status: 'Submitted',
      submittedDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
      slaDeadline: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      timeline: [
        {
          status: 'Submitted',
          date: new Date().toISOString(),
          updatedBy: newComplaintData.citizen?.name || 'Citizen',
          role: 'citizen',
          remarks: 'Grievance lodged via web portal.',
        },
      ],
      ...newComplaintData,
    };

    try {
      const res = await api.createComplaint(newComplaintData);
      if (res.success && res.data) {
        setComplaints(prev => [res.data, ...prev]);
        return res.data;
      }
    } catch (err) {
      console.warn('Backend API not reachable, saving to local real-time store:', err.message);
    }

    // Local fallback
    setComplaints(prev => [formatted, ...prev]);
    return formatted;
  }, []);

  // Action: Update complaint status
  const updateStatus = useCallback(async (id, status, remarks = '', officerName = 'Officer') => {
    try {
      const res = await api.updateComplaintStatus(id, { status, remarks, officerName });
      if (res.success && res.data) {
        setComplaints(prev => prev.map(c => (c.id === id ? res.data : c)));
        return res.data;
      }
    } catch (err) {
      console.warn('Backend API not reachable, updating local real-time store:', err.message);
    }

    // Local fallback
    setComplaints(prev =>
      prev.map(c => {
        if (c.id === id) {
          return {
            ...c,
            status,
            updatedDate: new Date().toISOString(),
            timeline: [
              ...(c.timeline || []),
              {
                status,
                date: new Date().toISOString(),
                updatedBy: officerName,
                role: 'officer',
                remarks: remarks || `Status updated to ${status}.`,
              },
            ],
          };
        }
        return c;
      })
    );
  }, []);

  // Action: Mark notification as read
  const markNotificationAsRead = useCallback((notifId) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notifId ? { ...n, read: true } : n))
    );
  }, []);

  return (
    <DataContext.Provider
      value={{
        complaints,
        notifications,
        stats,
        isLiveConnected,
        addComplaint,
        updateStatus,
        markNotificationAsRead,
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
