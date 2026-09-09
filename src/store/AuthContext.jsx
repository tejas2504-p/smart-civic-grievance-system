import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [role, setRole] = useState(() => {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved)?.role || null : null;
  });
  const [loading, setLoading] = useState(true);

  // Validate and hydrate user session from server on mount
  useEffect(() => {
    async function loadUserProfile() {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.getProfile();
        if (res.success && res.data) {
          setUser(res.data);
          setRole(res.data.role || 'citizen');
          localStorage.setItem('auth_user', JSON.stringify(res.data));

          // Authenticate realtime socket
          const socket = getSocket();
          if (socket && socket.connected) {
            socket.emit('authenticate', token);
          }
        } else {
          // Token invalid
          logout();
        }
      } catch (err) {
        console.warn('Session verification failed or server offline, keeping local user state if valid');
      } finally {
        setLoading(false);
      }
    }

    loadUserProfile();
  }, []);

  const login = (selectedRole, userData) => {
    const actualRole = userData?.role || selectedRole || 'citizen';
    const profile = userData || {
      _id: 'guest_id',
      name: actualRole === 'admin' ? 'Administrator' : actualRole === 'officer' ? 'Department Officer' : 'Citizen',
      role: actualRole,
      email: `${actualRole}@gov.in`,
    };

    setUser(profile);
    setRole(actualRole);
    localStorage.setItem('auth_user', JSON.stringify(profile));

    const token = localStorage.getItem('auth_token');
    if (token) {
      const socket = getSocket();
      if (socket) {
        socket.emit('authenticate', token);
      }
    }
  };

  const logout = () => {
    const socket = getSocket();
    if (socket) {
      socket.emit('logout');
    }

    setUser(null);
    setRole(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('portal_complaints');
    localStorage.removeItem('portal_notifications');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        login,
        logout,
        loading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
