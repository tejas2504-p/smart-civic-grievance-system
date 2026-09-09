import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import Complaint from '../../server/models/Complaint.js';
import User from '../../server/models/User.js';
import { createComplaintRouter } from '../../server/routes/complaints.js';

const app = express();
app.use(express.json());

// Mock Auth Middleware
app.use((req, res, next) => {
  req.user = { id: 'test-user-id', role: 'citizen', name: 'Test User' };
  next();
});

// We must bypass upload logic for simple integration test
app.use('/api/complaints', createComplaintRouter({ emit: () => {} }));

describe('Complaints E2E Logic', () => {
  it('should retrieve empty complaints list initially', async () => {
    const res = await request(app).get('/api/complaints');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it('should calculate SLA properly for new complaint', async () => {
    const newComplaint = new Complaint({
      id: 'COMP-E2E-1',
      userId: 'test-user-id',
      title: 'Pothole on Main St',
      description: 'Huge pothole',
      category: 'Roads',
      department: 'Roads Dept',
      priority: 'High'
    });
    
    await newComplaint.save();
    
    const res = await request(app).get('/api/complaints');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].slaState).toBe('ACTIVE');
    expect(res.body.data[0].escalationLevel).toBe(0);
  });
});
