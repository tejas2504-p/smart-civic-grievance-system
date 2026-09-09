import { describe, it, expect, beforeAll } from 'vitest';
import mongoose from 'mongoose';
import User from '../../server/models/User.js';
import Complaint from '../../server/models/Complaint.js';

describe('Backend Models Unit Tests', () => {
  it('should hash a password correctly in the User model', async () => {
    const user = new User({
      name: 'Test Citizen',
      email: 'testcitizen@example.com',
      phone: '9876543210',
      password: 'SecurePassword123!',
      role: 'citizen'
    });

    await user.save();
    
    // Asserts password was hashed
    expect(user.password).not.toBe('SecurePassword123!');
    expect(user.password.length).toBeGreaterThan(50); // bcrypt length is usually 60
    
    const isMatch = await user.comparePassword('SecurePassword123!');
    expect(isMatch).toBe(true);

    const isBadMatch = await user.comparePassword('WrongPassword');
    expect(isBadMatch).toBe(false);
  });

  it('should save successfully even if phone is arbitrary string (validation done in controller)', async () => {
    const user = new User({
      name: 'Invalid Phone',
      email: 'invalid@example.com',
      phone: '123',
      password: 'SecurePassword123!'
    });

    await user.save();
    expect(user._id).toBeDefined();
  });

  it('should create a Complaint with correct default SLA state', async () => {
    const complaint = new Complaint({
      id: 'COMP-12345',
      title: 'Water Leakage',
      description: 'Pipe is broken',
      category: 'Water',
      department: 'Water Dept',
      priority: 'High',
    });

    await complaint.save();

    expect(complaint.slaState).toBe('ACTIVE');
    expect(complaint.escalationLevel).toBe(0);
    expect(complaint.status).toBe('Submitted');
    expect(complaint.slaDeadline).toBeDefined();
  });
});
