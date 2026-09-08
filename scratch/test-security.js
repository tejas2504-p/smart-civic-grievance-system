import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

async function request(method, endpoint, payload = null, headers = {}) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
  };
  if (payload) options.body = JSON.stringify(payload);
  const res = await fetch(`${API_BASE}${endpoint}`, options);
  
  let data;
  try { data = await res.json(); } catch(e) { data = await res.text(); }
  return { status: res.status, data };
}

async function runTests() {
  console.log('--- Running Security Hardening Tests ---');

  // 1. NoSQL Injection Test on Login
  console.log('\n[Test 1] NoSQL Injection on /auth/login');
  const loginRes = await request('POST', '/auth/login', {
    email: { "$ne": null },
    password: "Password123!"
  });
  // Should be 400 due to typeof checking, or 401
  if (loginRes.status === 400 || loginRes.status === 401) {
    console.log(`✅ PASS: Injection blocked. Status: ${loginRes.status}`);
  } else {
    console.error('❌ FAIL: Injection not blocked.', loginRes);
  }

  // 2. Unauthenticated POST to /complaints
  console.log('\n[Test 2] Unauthenticated POST /complaints');
  const postRes = await request('POST', '/complaints', {
    title: 'Hacked',
    description: 'Hacked',
    category: 'Water',
    department: 'Water'
  });
  if (postRes.status === 401) {
    console.log('✅ PASS: Unauthenticated POST blocked.');
  } else {
    console.error('❌ FAIL: Unauthenticated POST allowed.', postRes);
  }

  // 3. Unauthenticated PATCH to /complaints/:id/status
  console.log('\n[Test 3] Unauthenticated PATCH /complaints/123/status');
  const patchRes = await request('PATCH', '/complaints/123/status', { status: 'Closed' });
  if (patchRes.status === 401 || patchRes.status === 403) {
    console.log(`✅ PASS: Unauthenticated PATCH blocked. Status: ${patchRes.status}`);
  } else {
    console.error('❌ FAIL: Unauthenticated PATCH allowed.', patchRes);
  }

  // 4. File Size Limits on /complaints (requires dummy token to bypass 401)
  // Let's generate a valid JWT for testing file limits
  import('jsonwebtoken').then(async (jwt) => {
    const token = jwt.default.sign({ id: 'dummy', role: 'citizen' }, process.env.JWT_SECRET || 'grievance_portal_jwt_secret_key_2026');
    
    console.log('\n[Test 4] Attachment Limit / Size test');
    // Create an array of 6 attachments
    const fileRes = await request('POST', '/complaints', {
      title: 'Valid', description: 'Valid', category: 'Water', department: 'Water',
      attachments: [1, 2, 3, 4, 5, 6]
    }, { Authorization: `Bearer ${token}` });

    if (fileRes.status === 400 && fileRes.data.message.includes('Maximum 5')) {
      console.log('✅ PASS: Maximum attachment count enforced.');
    } else {
      console.error('❌ FAIL: Attachment count limit failed.', fileRes);
    }
    
    // Large string (simulate > 5MB base64)
    const largeStr = 'a'.repeat(6 * 1024 * 1024);
    const sizeRes = await request('POST', '/complaints', {
      title: 'Valid', description: 'Valid', category: 'Water', department: 'Water',
      attachments: [largeStr]
    }, { Authorization: `Bearer ${token}` });

    if (sizeRes.status === 400 && sizeRes.data.message.includes('exceeds')) {
      console.log('✅ PASS: Attachment size limit enforced.');
    } else {
      console.error('❌ FAIL: Attachment size limit failed.', sizeRes);
    }

    console.log('\nAll security tests complete.');
    process.exit(0);
  });
}

runTests();
