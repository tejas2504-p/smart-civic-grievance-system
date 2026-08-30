import React, { createContext, useContext, useState } from 'react';
import { mockUser, mockOfficer, mockAdmin } from '../data/mockData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // role: 'citizen' | 'officer' | 'admin' | null
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  const login = (selectedRole) => {
    if (selectedRole === 'citizen') { setUser(mockUser); setRole('citizen'); }
    else if (selectedRole === 'officer') { setUser(mockOfficer); setRole('officer'); }
    else if (selectedRole === 'admin') { setUser(mockAdmin); setRole('admin'); }
  };

  const logout = () => { setUser(null); setRole(null); };

  return (
    <AuthContext.Provider value={{ user, role, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
