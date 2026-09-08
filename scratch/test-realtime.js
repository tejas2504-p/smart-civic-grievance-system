import { io } from 'socket.io-client';
import jwt from 'jsonwebtoken';

const SERVER_URL = 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'grievance_portal_jwt_secret_key_2026';

// 1. Generate fake JWTs
const citizenToken = jwt.sign({ id: '6aa01e9deb91679970f65201', role: 'citizen' }, JWT_SECRET);
const officerToken = jwt.sign({ id: '6aa01e9deb91679970f65202', role: 'officer', department: 'Water' }, JWT_SECRET);

// 2. Setup Sockets
const citizenSocket = io(SERVER_URL, { auth: { token: citizenToken }, transports: ['websocket'] });
const officerSocket = io(SERVER_URL, { auth: { token: officerToken }, transports: ['websocket'] });

let complaintId = null;
let testPassed = { newGrievance: false, newNotification: false, newMessage: false };

console.log('--- Starting Real-Time Socket Tests ---');

// Monitor Officer
officerSocket.on('connect', () => console.log('✅ Officer Socket connected.'));
officerSocket.on('new_grievance', (data) => {
  console.log(`📨 Officer received 'new_grievance': ${data.complaint.id}`);
  testPassed.newGrievance = true;
});

// Monitor Citizen
citizenSocket.on('connect', () => console.log('✅ Citizen Socket connected.'));
citizenSocket.on('new_notification', (notif) => {
  console.log(`📨 Citizen received 'new_notification': ${notif.title}`);
  testPassed.newNotification = true;
});
citizenSocket.on('new_message', (msg) => {
  console.log(`💬 Citizen received 'new_message': ${msg.message}`);
  testPassed.newMessage = true;
  
  if (testPassed.newGrievance && testPassed.newNotification && testPassed.newMessage) {
    console.log('\n🎉 ALL REAL-TIME SOCKET TESTS PASSED!');
    process.exit(0);
  }
});

// 3. Execute Tests After Delay
setTimeout(async () => {
  try {
    // A. Lodge Complaint
    console.log('\n[Test A] Lodging Complaint...');
    const res1 = await fetch(`${SERVER_URL}/api/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${citizenToken}` },
      body: JSON.stringify({
        title: 'Water Leak',
        description: 'Big leak',
        category: 'Water',
        department: 'Water'
      })
    });
    const data1 = await res1.json();
    if (!data1.success) throw new Error(data1.message);
    complaintId = data1.data.id;
    
    // Join Chat
    citizenSocket.emit('join_complaint', complaintId);
    officerSocket.emit('join_complaint', complaintId);

    // B. Send Chat Message
    setTimeout(async () => {
      console.log('\n[Test B] Sending Message from Officer...');
      await fetch(`${SERVER_URL}/api/complaints/${complaintId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${officerToken}` },
        body: JSON.stringify({ message: 'We are looking into this.' })
      });
    }, 1000);

  } catch (e) {
    console.error('❌ Test failed:', e);
    process.exit(1);
  }
}, 2000);

setTimeout(() => {
  console.error('❌ Tests timed out.', testPassed);
  process.exit(1);
}, 6000);
