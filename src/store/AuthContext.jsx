import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('auth_user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (!parsed) return null;
      // Self-heal corrupted shape where role was accidentally stored as the full user object
      if (parsed.role && typeof parsed.role === 'object') {
        const actualRole = typeof parsed.role.role === 'string' ? parsed.role.role : 'citizen';
        const healed = { ...parsed.role, role: actualRole };
        localStorage.setItem('auth_user', JSON.stringify(healed));
        return healed;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const [role, setRole] = useState(() => {
    try {
      const saved = localStorage.getItem('auth_user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (!parsed) return null;
      if (typeof parsed.role === 'string') return parsed.role;
      if (parsed.role && typeof parsed.role === 'object' && typeof parsed.role.role === 'string') {
        return parsed.role.role;
      }
      return 'citizen';
    } catch {
      return null;
    }
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
          const actualRole = typeof res.data.role === 'string' ? res.data.role : 'citizen';
          const profile = { ...res.data, role: actualRole };
          setUser(profile);
          setRole(actualRole);
          localStorage.setItem('auth_user', JSON.stringify(profile));

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

  const login = (roleOrUser, maybeUserData) => {
    let actualRole = 'citizen';
    let profile = null;

    if (roleOrUser && typeof roleOrUser === 'object') {
      // Called like: login(userData)
      profile = { ...roleOrUser };
      actualRole = typeof profile.role === 'string' ? profile.role : (profile.role?.role || 'citizen');
      profile.role = actualRole;
    } else if (typeof roleOrUser === 'string') {
      // Called like: login('citizen', userData) or login('admin')
      actualRole = (maybeUserData && typeof maybeUserData.role === 'string') ? maybeUserData.role : roleOrUser;
      profile = maybeUserData ? { ...maybeUserData, role: actualRole } : {
        _id: 'guest_id',
        name: actualRole === 'admin' ? 'Administrator' : actualRole === 'officer' ? 'Department Officer' : 'Citizen',
        role: actualRole,
        email: `${actualRole}@gov.in`,
      };
    } else if (maybeUserData && typeof maybeUserData === 'object') {
      profile = { ...maybeUserData };
      actualRole = typeof profile.role === 'string' ? profile.role : 'citizen';
      profile.role = actualRole;
    }

    setUser(profile);
    setRole(actualRole);
    if (profile) {
      localStorage.setItem('auth_user', JSON.stringify(profile));
    }

    const token = profile?.token || localStorage.getItem('auth_token');
    if (token) {
      localStorage.setItem('auth_token', token);
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
