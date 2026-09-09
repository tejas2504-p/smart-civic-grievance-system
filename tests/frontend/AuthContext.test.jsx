import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../../src/store/AuthContext';

const TestComponent = () => {
  const { user, login, logout, isAuthenticated } = useAuth();
  
  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'Logged In' : 'Logged Out'}</div>
      <div data-testid="user-name">{user ? user.name : 'None'}</div>
      <button 
        onClick={() => login({ name: 'Test User', role: 'citizen', token: 'mock-jwt-token' })}
        data-testid="login-btn"
      >
        Login
      </button>
      <button onClick={logout} data-testid="logout-btn">Logout</button>
    </div>
  );
};

describe('AuthContext Frontend Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should default to logged out state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status').textContent).toBe('Logged Out');
    expect(screen.getByTestId('user-name').textContent).toBe('None');
  });

  it('should update state and localstorage on login', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    act(() => {
      screen.getByTestId('login-btn').click();
    });

    expect(screen.getByTestId('auth-status').textContent).toBe('Logged In');
    expect(screen.getByTestId('user-name').textContent).toBe('Test User');
    
    // Ensure localStorage was populated correctly to fix the E2E bug
    const storedUser = JSON.parse(localStorage.getItem('user'));
    expect(storedUser.name).toBe('Test User');
    expect(storedUser.token).toBe('mock-jwt-token');
  });

  it('should clear state on logout', () => {
    // Setup initial state
    localStorage.setItem('user', JSON.stringify({ name: 'Persisted User', role: 'officer' }));
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Assert persistence read from storage
    expect(screen.getByTestId('auth-status').textContent).toBe('Logged In');
    expect(screen.getByTestId('user-name').textContent).toBe('Persisted User');

    // Trigger logout
    act(() => {
      screen.getByTestId('logout-btn').click();
    });

    // Assert cleared
    expect(screen.getByTestId('auth-status').textContent).toBe('Logged Out');
    expect(localStorage.getItem('user')).toBeNull();
  });
});
