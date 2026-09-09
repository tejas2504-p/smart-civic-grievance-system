import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';
import Complaint from './models/Complaint.js';
import OTPVerification from './models/OTPVerification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${testName} -> ${details}`);
    failed++;
  }
}

async function runIsolationTestSuite() {
  console.log('===============================================================');
  console.log('🧪 MULTI-USER ISOLATION & REALTIME MONGODB TEST SUITE');
  console.log('===============================================================');

  // 1. Connect to MongoDB Atlas
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('📦 Connected to MongoDB Atlas');

  // Clean previous test data
  const sahilEmail = 'sahil.isolation.test@smartportal.gov.in';
  const tejasEmail = 'tejas.isolation.test@smartportal.gov.in';
  const adminEmail = 'admin.isolation.test@smartportal.gov.in';

  await User.deleteMany({ email: { $in: [sahilEmail, tejasEmail, adminEmail] } });
  await Complaint.deleteMany({ title: { $in: [
    'Pothole on Main St',
    'Broken streetlight on 5th Ave',
    'Water leakage in Block A',
    'Garbage dump near park',
    'Illegal parking on sidewalk',
    'Drainage overflow'
  ] } });
  await OTPVerification.deleteMany({ email: { $in: [sahilEmail, tejasEmail] } });
  console.log('🧹 Cleaned previous test runs from MongoDB Atlas.\n');

  try {
    // -------------------------------------------------------------
    // STEP 1: Register Sahil & get token
    // -------------------------------------------------------------
    console.log('--- Step 1: Register Sahil ---');
    const sahilVerificationId = 'v-sahil-' + Date.now();
    await OTPVerification.create({
      verificationId: sahilVerificationId,
      phoneNumber: '+918452940085',
      email: sahilEmail,
      phoneOtpHash: 'verified_hash',
      emailOtpHash: 'verified_hash',
      phoneVerified: true,
      emailVerified: true,
      expiresAt: new Date(Date.now() + 3600000),
      purpose: 'registration',
      pendingRegistration: {
        name: 'Sahil Narkar',
        passwordHash: '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', // 'Password123!'
        address: 'Pune, Maharashtra',
        role: 'citizen',
      },
    });

    const sahilRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationId: sahilVerificationId }),
    });
    const sahilRegData = await sahilRegRes.json();
    assert(sahilRegRes.status === 201 && sahilRegData.data?.token, 'Sahil registered with real dual-verified OTP session and received JWT');
    const sahilToken = sahilRegData.data.token;
    const sahilUserId = sahilRegData.data._id;

    // -------------------------------------------------------------
    // STEP 2 & 3: Sahil creates Complaint 1 & 2
    // -------------------------------------------------------------
    console.log('\n--- Steps 2 & 3: Sahil creates 2 complaints ---');
    const sahilC1Res = await fetch(`${BASE_URL}/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sahilToken}`,
      },
      body: JSON.stringify({
        title: 'Pothole on Main St',
        description: 'Dangerous pothole near the central junction',
        category: 'Roads & Footpaths',
        department: 'Road Maintenance',
        priority: 'High',
        location: { address: 'Main St Junction', city: 'Pune', lat: 18.5204, lng: 73.8567 },
      }),
    });
    const sahilC1Data = await sahilC1Res.json();
    assert(sahilC1Res.status === 201 && sahilC1Data.data?.id, 'Sahil Complaint 1 created: Pothole on Main St');
    const sahilComplaint1 = sahilC1Data.data;

    const sahilC2Res = await fetch(`${BASE_URL}/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sahilToken}`,
      },
      body: JSON.stringify({
        title: 'Broken streetlight on 5th Ave',
        description: 'Dark area at night due to faulty streetlight',
        category: 'Electricity & Lighting',
        department: 'Electricity Board',
        priority: 'Medium',
        location: { address: '5th Ave, Near Park', city: 'Pune', lat: 18.5210, lng: 73.8570 },
      }),
    });
    const sahilC2Data = await sahilC2Res.json();
    assert(sahilC2Res.status === 201 && sahilC2Data.data?.id, 'Sahil Complaint 2 created: Broken streetlight on 5th Ave');
    const sahilComplaint2 = sahilC2Data.data;

    // -------------------------------------------------------------
    // STEP 4: Register Tejas & get token
    // -------------------------------------------------------------
    console.log('\n--- Step 4: Register Tejas ---');
    const tejasVerificationId = 'v-tejas-' + Date.now();
    await OTPVerification.create({
      verificationId: tejasVerificationId,
      phoneNumber: '+919820098200',
      email: tejasEmail,
      phoneOtpHash: 'verified_hash_2',
      emailOtpHash: 'verified_hash_2',
      phoneVerified: true,
      emailVerified: true,
      expiresAt: new Date(Date.now() + 3600000),
      purpose: 'registration',
      pendingRegistration: {
        name: 'Tejas Patil',
        passwordHash: '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
        address: 'Shivaji Nagar, Pune',
        role: 'citizen',
      },
    });

    const tejasRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationId: tejasVerificationId }),
    });
    const tejasRegData = await tejasRegRes.json();
    assert(tejasRegRes.status === 201 && tejasRegData.data?.token, 'Tejas registered with real dual-verified OTP session and received JWT');
    const tejasToken = tejasRegData.data.token;
    const tejasUserId = tejasRegData.data._id;

    // -------------------------------------------------------------
    // STEPS 5, 6, 7, 8: Tejas creates 4 complaints
    // -------------------------------------------------------------
    console.log('\n--- Steps 5 to 8: Tejas creates 4 complaints ---');
    const tejasComplaintTitles = [
      { title: 'Water leakage in Block A', category: 'Water Supply', dept: 'Water Supply & Sewerage', prio: 'High' },
      { title: 'Garbage dump near park', category: 'Garbage & Cleanliness', dept: 'Solid Waste Management', prio: 'Medium' },
      { title: 'Illegal parking on sidewalk', category: 'Traffic & Parking', dept: 'Traffic Police', prio: 'Low' },
      { title: 'Drainage overflow', category: 'Drainage & Sewage', dept: 'Water Supply & Sewerage', prio: 'Critical' },
    ];

    const tejasComplaints = [];
    for (const item of tejasComplaintTitles) {
      const res = await fetch(`${BASE_URL}/complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tejasToken}`,
        },
        body: JSON.stringify({
          title: item.title,
          description: `Citizen grievance reported for ${item.title}`,
          category: item.category,
          department: item.dept,
          priority: item.prio,
          location: { address: 'Shivaji Nagar', city: 'Pune', lat: 18.5314, lng: 73.8446 },
        }),
      });
      const data = await res.json();
      assert(res.status === 201 && data.data?.id, `Tejas Complaint created: ${item.title}`);
      tejasComplaints.push(data.data);
    }

    // -------------------------------------------------------------
    // STEP 9: Query Sahil's complaints -> ASSERT exactly 2 returned
    // -------------------------------------------------------------
    console.log('\n--- Step 9: Query Sahil complaints ---');
    const sahilGetRes = await fetch(`${BASE_URL}/complaints/my`, {
      headers: { 'Authorization': `Bearer ${sahilToken}` },
    });
    const sahilGetData = await sahilGetRes.json();
    assert(
      sahilGetData.count === 2 && sahilGetData.data?.length === 2,
      `Sahil gets EXACTLY 2 complaints (count: ${sahilGetData.count})`,
      `Expected 2, got ${sahilGetData.count}`
    );
    assert(
      sahilGetData.data && sahilGetData.data.every(c => c.userId.toString() === sahilUserId.toString()),
      'All complaints returned belong strictly to Sahil'
    );

    // -------------------------------------------------------------
    // STEP 10: Query Tejas's complaints -> ASSERT exactly 4 returned
    // -------------------------------------------------------------
    console.log('\n--- Step 10: Query Tejas complaints ---');
    const tejasGetRes = await fetch(`${BASE_URL}/complaints/my`, {
      headers: { 'Authorization': `Bearer ${tejasToken}` },
    });
    const tejasGetData = await tejasGetRes.json();
    assert(
      tejasGetData.count === 4 && tejasGetData.data.length === 4,
      `Tejas gets EXACTLY 4 complaints (count: ${tejasGetData.count})`,
      `Expected 4, got ${tejasGetData.count}`
    );
    assert(
      tejasGetData.data.every(c => c.userId.toString() === tejasUserId.toString()),
      'All complaints returned belong strictly to Tejas'
    );

    // -------------------------------------------------------------
    // STEP 11: Attempt to access Tejas's complaint using Sahil's token -> ASSERT 403 Forbidden
    // -------------------------------------------------------------
    console.log('\n--- Step 11: Cross-user access check (Sahil token accessing Tejas complaint) ---');
    const crossAccessRes = await fetch(`${BASE_URL}/complaints/${tejasComplaints[0].id}`, {
      headers: { 'Authorization': `Bearer ${sahilToken}` },
    });
    assert(
      crossAccessRes.status === 403,
      'Accessing Tejas complaint with Sahil token returns 403 Forbidden',
      `Got status: ${crossAccessRes.status}`
    );

    // -------------------------------------------------------------
    // STEP 12: Attempt to delete Tejas's complaint using Sahil's token -> ASSERT 403 Forbidden
    // -------------------------------------------------------------
    console.log('\n--- Step 12: Cross-user deletion check (Sahil token deleting Tejas complaint) ---');
    const crossDeleteRes = await fetch(`${BASE_URL}/complaints/${tejasComplaints[0].id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${sahilToken}` },
    });
    assert(
      crossDeleteRes.status === 403,
      'Deleting Tejas complaint with Sahil token returns 403 Forbidden',
      `Got status: ${crossDeleteRes.status}`
    );

    // -------------------------------------------------------------
    // STEP 13: Sahil deletes Complaint 1 -> ASSERT 200 OK
    // -------------------------------------------------------------
    console.log('\n--- Step 13: Sahil deletes Complaint 1 ---');
    const sahilDeleteRes = await fetch(`${BASE_URL}/complaints/${sahilComplaint1.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${sahilToken}` },
    });
    assert(
      sahilDeleteRes.status === 200,
      `Sahil deletes Complaint 1 (${sahilComplaint1.id}) successfully -> HTTP 200 OK`,
      `Got status: ${sahilDeleteRes.status}`
    );

    // -------------------------------------------------------------
    // STEP 14: Query Sahil's complaints -> ASSERT exactly 1 remains
    // -------------------------------------------------------------
    console.log('\n--- Step 14: Verify Sahil complaints count after deletion ---');
    const sahilAfterDeleteRes = await fetch(`${BASE_URL}/complaints/my`, {
      headers: { 'Authorization': `Bearer ${sahilToken}` },
    });
    const sahilAfterDeleteData = await sahilAfterDeleteRes.json();
    assert(
      sahilAfterDeleteData.count === 1 && sahilAfterDeleteData.data.length === 1,
      `Sahil has EXACTLY 1 complaint remaining (count: ${sahilAfterDeleteData.count})`,
      `Expected 1, got ${sahilAfterDeleteData.count}`
    );
    assert(
      sahilAfterDeleteData.data[0].id === sahilComplaint2.id,
      `Remaining complaint is Complaint 2 (${sahilComplaint2.id})`
    );

    // -------------------------------------------------------------
    // STEP 15: Query Tejas's complaints -> ASSERT still exactly 4 complaints remain
    // -------------------------------------------------------------
    console.log('\n--- Step 15: Verify Tejas complaints unaffected by Sahil deletion ---');
    const tejasAfterDeleteRes = await fetch(`${BASE_URL}/complaints/my`, {
      headers: { 'Authorization': `Bearer ${tejasToken}` },
    });
    const tejasAfterDeleteData = await tejasAfterDeleteRes.json();
    assert(
      tejasAfterDeleteData.count === 4 && tejasAfterDeleteData.data.length === 4,
      `Tejas STILL has EXACTLY 4 complaints (unaffected by Sahil deletion)`,
      `Expected 4, got ${tejasAfterDeleteData.count}`
    );

    // -------------------------------------------------------------
    // STEP 16: Admin logs in -> ASSERT Admin sees all complaints (5 total: 1 Sahil + 4 Tejas)
    // -------------------------------------------------------------
    console.log('\n--- Step 16: Admin verification ---');
    // Ensure admin user exists
    let adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'System Admin',
        email: adminEmail,
        phone: '9820098201',
        password: 'AdminPassword123!',
        role: 'admin',
      });
    }

    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: 'AdminPassword123!' }),
    });
    const adminLoginData = await adminLoginRes.json();
    console.log('Admin login response:', adminLoginRes.status, adminLoginData);
    assert(adminLoginRes.status === 200 && adminLoginData.data?.token, 'Admin logged in successfully');
    const adminToken = adminLoginData.data?.token;

    const adminComplaintsRes = await fetch(`${BASE_URL}/complaints/admin`, {
      headers: { 'Authorization': `Bearer ${adminToken}` },
    });
    const adminComplaintsData = await adminComplaintsRes.json();
    const testComplaints = adminComplaintsData.data.filter(c =>
      c.userId && (c.userId.toString() === sahilUserId.toString() || c.userId.toString() === tejasUserId.toString())
    );

    assert(
      testComplaints.length === 5,
      `Admin sees all 5 active test complaints (1 from Sahil + 4 from Tejas)`,
      `Expected 5, got ${testComplaints.length}`
    );

    // -------------------------------------------------------------
    // STEP 17: Verify in MongoDB Atlas that the deleted complaint is truly deleted, not just hidden
    // -------------------------------------------------------------
    console.log('\n--- Step 17: Verify physical deletion in MongoDB Atlas ---');
    const dbDeletedCheck = await Complaint.findById(sahilComplaint1._id);
    assert(
      dbDeletedCheck === null,
      'Complaint is completely removed from MongoDB Atlas (Complaint.findById returns null, not soft-deleted)'
    );

    // Clean up test data after successful verification
    await User.deleteMany({ email: { $in: [sahilEmail, tejasEmail, adminEmail] } });
    await Complaint.deleteMany({ _id: { $in: [sahilComplaint2._id, ...tejasComplaints.map(t => t._id)] } });
    await OTPVerification.deleteMany({ email: { $in: [sahilEmail, tejasEmail] } });
    console.log('\n🧹 Test artifacts cleaned from MongoDB Atlas.');

  } catch (error) {
    console.error('\n💥 Unexpected test failure:', error);
    failed++;
  } finally {
    await mongoose.disconnect();
  }

  console.log('\n===============================================================');
  console.log(`📊 FINAL TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');
  process.exit(failed > 0 ? 1 : 0);
}

runIsolationTestSuite();
