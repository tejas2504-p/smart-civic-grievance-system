// Mock data for the Smart Government Grievance Portal
// Replace API calls here when backend is ready

export const mockUser = {
  id: 'CIT-001',
  name: 'Rajesh Kumar',
  email: 'rajesh.kumar@email.com',
  mobile: '+91 98765 43210',
  role: 'citizen',
  address: '12, Shivaji Nagar, Pune',
  city: 'Pune',
  state: 'Maharashtra',
  pincode: '411001',
  joinedDate: '2025-01-15',
  avatar: null,
};

export const mockOfficer = {
  id: 'OFF-045',
  name: 'Suresh Patil',
  employeeId: 'EMP-2045',
  email: 'suresh.patil@gov.mh.in',
  mobile: '+91 97654 32109',
  role: 'officer',
  department: 'Road Maintenance',
  designation: 'Junior Engineer',
  joinedDate: '2023-06-01',
  avatar: null,
};

export const mockAdmin = {
  id: 'ADM-001',
  name: 'Priya Sharma',
  email: 'priya.sharma@gov.mh.in',
  role: 'admin',
  department: 'Administration',
  avatar: null,
};

export const departments = [
  { id: 'dept-1', name: 'Road Maintenance', code: 'RDM', officers: 14, complaints: 342, pending: 78, resolved: 240, status: 'active' },
  { id: 'dept-2', name: 'Water Supply', code: 'WTS', officers: 10, complaints: 215, pending: 45, resolved: 158, status: 'active' },
  { id: 'dept-3', name: 'Electricity', code: 'ELC', officers: 12, complaints: 189, pending: 34, resolved: 142, status: 'active' },
  { id: 'dept-4', name: 'Sanitation', code: 'SAN', officers: 8, complaints: 274, pending: 92, resolved: 175, status: 'active' },
  { id: 'dept-5', name: 'Public Health', code: 'PHT', officers: 6, complaints: 98, pending: 22, resolved: 72, status: 'active' },
  { id: 'dept-6', name: 'Parks & Recreation', code: 'PRK', officers: 5, complaints: 67, pending: 15, resolved: 50, status: 'active' },
  { id: 'dept-7', name: 'Education', code: 'EDU', officers: 7, complaints: 45, pending: 10, resolved: 34, status: 'active' },
  { id: 'dept-8', name: 'Transport', code: 'TRN', officers: 9, complaints: 123, pending: 28, resolved: 87, status: 'active' },
];

export const categories = [
  {
    id: 'cat-1',
    name: 'Road Infrastructure',
    subcategories: ['Pothole', 'Damaged Road', 'Broken Footpath', 'Road Obstruction', 'Missing Road Sign'],
    department: 'Road Maintenance',
    defaultPriority: 'High',
    slaDays: 3,
  },
  {
    id: 'cat-2',
    name: 'Water Supply',
    subcategories: ['No Water Supply', 'Leaking Pipeline', 'Contaminated Water', 'Water Pressure Issue'],
    department: 'Water Supply',
    defaultPriority: 'Critical',
    slaDays: 1,
  },
  {
    id: 'cat-3',
    name: 'Electricity',
    subcategories: ['Power Outage', 'Streetlight Issue', 'Dangerous Wiring', 'Meter Issue'],
    department: 'Electricity',
    defaultPriority: 'High',
    slaDays: 2,
  },
  {
    id: 'cat-4',
    name: 'Sanitation',
    subcategories: ['Garbage Not Collected', 'Open Drain', 'Blocked Drain', 'Illegal Dumping'],
    department: 'Sanitation',
    defaultPriority: 'Medium',
    slaDays: 7,
  },
  {
    id: 'cat-5',
    name: 'Public Health',
    subcategories: ['Mosquito Breeding', 'Stray Animals', 'Food Safety', 'Disease Outbreak'],
    department: 'Public Health',
    defaultPriority: 'High',
    slaDays: 3,
  },
  {
    id: 'cat-6',
    name: 'Parks & Public Spaces',
    subcategories: ['Broken Equipment', 'Dirty Park', 'Encroachment', 'Damaged Bench'],
    department: 'Parks & Recreation',
    defaultPriority: 'Low',
    slaDays: 15,
  },
];

export const complaints = [
  {
    id: 'CMP-10245',
    title: 'Large Pothole on MG Road near Post Office',
    description: 'There is a very large pothole on MG Road near the main post office. It has been there for 3 weeks and is causing accidents. Two-wheelers have fallen. Please fix urgently.',
    category: 'Road Infrastructure',
    subcategory: 'Pothole',
    department: 'Road Maintenance',
    priority: 'High',
    status: 'In Progress',
    location: {
      address: 'MG Road, near Post Office',
      city: 'Pune',
      pincode: '411001',
      lat: 18.5204,
      lng: 73.8567,
    },
    citizen: { name: 'Rajesh Kumar', mobile: '+91 98765 43210', email: 'rajesh@email.com' },
    officer: { name: 'Suresh Patil', id: 'OFF-045' },
    submittedDate: '2026-08-20',
    lastUpdated: '2026-08-21',
    expectedResolution: '2026-08-23',
    attachments: [
      { name: 'pothole_photo.jpg', type: 'image', url: null },
    ],
    timeline: [
      { status: 'Complaint Submitted', date: '2026-08-20', time: '09:30 AM', done: true, note: 'Complaint registered successfully' },
      { status: 'Complaint Reviewed', date: '2026-08-20', time: '11:00 AM', done: true, note: 'Reviewed and verified by admin' },
      { status: 'Assigned to Department', date: '2026-08-21', time: '09:00 AM', done: true, note: 'Assigned to Road Maintenance department' },
      { status: 'Investigation in Progress', date: '2026-08-21', time: '02:00 PM', done: true, note: 'Officer Suresh Patil is investigating' },
      { status: 'Resolution', date: null, time: null, done: false, note: 'Pending' },
    ],
    aiAnalysis: {
      category: 'Road Infrastructure',
      subcategory: 'Pothole',
      priority: 'High',
      department: 'Road Maintenance',
      summary: 'Large pothole reported on main road causing safety hazard and accidents. Immediate attention required.',
      confidence: 94,
      duplicateProbability: 12,
    },
    conversation: [
      { id: 1, sender: 'officer', name: 'Suresh Patil', message: 'Dear citizen, we have received your complaint and an inspection is scheduled for tomorrow.', date: '2026-08-21', time: '02:30 PM' },
      { id: 2, sender: 'citizen', name: 'Rajesh Kumar', message: 'Thank you. Please fix it as soon as possible, it is very dangerous.', date: '2026-08-21', time: '03:00 PM' },
    ],
    rating: null,
    feedback: null,
  },
  {
    id: 'CMP-10244',
    title: 'No Water Supply for 3 Days in Shivaji Nagar',
    description: 'We have not received any water supply for 3 days. The entire area is facing this issue.',
    category: 'Water Supply',
    subcategory: 'No Water Supply',
    department: 'Water Supply',
    priority: 'Critical',
    status: 'Assigned',
    location: { address: 'Shivaji Nagar', city: 'Pune', pincode: '411004', lat: 18.5314, lng: 73.8446 },
    citizen: { name: 'Rajesh Kumar', mobile: '+91 98765 43210', email: 'rajesh@email.com' },
    officer: { name: 'Anil Deshmukh', id: 'OFF-032' },
    submittedDate: '2026-08-19',
    lastUpdated: '2026-08-21',
    expectedResolution: '2026-08-21',
    attachments: [],
    timeline: [
      { status: 'Complaint Submitted', date: '2026-08-19', time: '08:00 AM', done: true },
      { status: 'Complaint Reviewed', date: '2026-08-19', time: '10:00 AM', done: true },
      { status: 'Assigned to Department', date: '2026-08-21', time: '09:00 AM', done: true },
      { status: 'Investigation in Progress', date: null, time: null, done: false },
      { status: 'Resolution', date: null, time: null, done: false },
    ],
    aiAnalysis: { category: 'Water Supply', priority: 'Critical', department: 'Water Supply', summary: 'Water supply disruption for 3 days in residential area.', confidence: 97, duplicateProbability: 8 },
    conversation: [],
    rating: null,
    feedback: null,
  },
  {
    id: 'CMP-10230',
    title: 'Streetlight Not Working on Nehru Road',
    description: 'Street light at Nehru Road junction has been non-functional for 2 weeks causing safety issues at night.',
    category: 'Electricity',
    subcategory: 'Streetlight Issue',
    department: 'Electricity',
    priority: 'Medium',
    status: 'Resolved',
    location: { address: 'Nehru Road Junction', city: 'Pune', pincode: '411002', lat: 18.5089, lng: 73.8259 },
    citizen: { name: 'Rajesh Kumar', mobile: '+91 98765 43210', email: 'rajesh@email.com' },
    officer: { name: 'Ganesh More', id: 'OFF-018' },
    submittedDate: '2026-08-10',
    lastUpdated: '2026-08-18',
    expectedResolution: '2026-08-12',
    attachments: [],
    timeline: [
      { status: 'Complaint Submitted', date: '2026-08-10', done: true },
      { status: 'Complaint Reviewed', date: '2026-08-10', done: true },
      { status: 'Assigned to Department', date: '2026-08-11', done: true },
      { status: 'Investigation in Progress', date: '2026-08-11', done: true },
      { status: 'Resolved', date: '2026-08-18', done: true },
    ],
    aiAnalysis: { category: 'Electricity', priority: 'Medium', department: 'Electricity', summary: 'Streetlight outage on main road.', confidence: 91, duplicateProbability: 5 },
    conversation: [],
    rating: 4,
    feedback: 'Issue was resolved. Thank you.',
  },
  {
    id: 'CMP-10215',
    title: 'Open Drain in Market Area',
    description: 'There is an open drain near the market that is causing foul smell and health hazard.',
    category: 'Sanitation',
    subcategory: 'Open Drain',
    department: 'Sanitation',
    priority: 'High',
    status: 'Under Review',
    location: { address: 'Market Area, Camp', city: 'Pune', pincode: '411001', lat: 18.5127, lng: 73.8639 },
    citizen: { name: 'Rajesh Kumar', mobile: '+91 98765 43210', email: 'rajesh@email.com' },
    officer: null,
    submittedDate: '2026-08-21',
    lastUpdated: '2026-08-21',
    expectedResolution: '2026-08-28',
    attachments: [],
    timeline: [
      { status: 'Complaint Submitted', date: '2026-08-21', done: true },
      { status: 'Under Review', date: '2026-08-21', done: true },
      { status: 'Assigned to Department', date: null, done: false },
      { status: 'Resolution', date: null, done: false },
    ],
    aiAnalysis: { category: 'Sanitation', priority: 'High', department: 'Sanitation', summary: 'Open drain causing health hazard near market.', confidence: 89, duplicateProbability: 20 },
    conversation: [],
    rating: null,
    feedback: null,
  },
];

export const notifications = [
  { id: 'n1', type: 'status_change', title: 'Complaint Status Updated', message: 'Your complaint CMP-10245 is now In Progress.', date: '2026-08-21', time: '2:00 PM', read: false, complaintId: 'CMP-10245' },
  { id: 'n2', type: 'message', title: 'New Message from Officer', message: 'Officer Suresh Patil has sent you a message regarding CMP-10245.', date: '2026-08-21', time: '2:30 PM', read: false, complaintId: 'CMP-10245' },
  { id: 'n3', type: 'resolved', title: 'Complaint Resolved', message: 'Your complaint CMP-10230 has been resolved.', date: '2026-08-18', time: '5:00 PM', read: true, complaintId: 'CMP-10230' },
  { id: 'n4', type: 'assignment', title: 'Complaint Assigned', message: 'Complaint CMP-10244 has been assigned to an officer.', date: '2026-08-21', time: '9:00 AM', read: true, complaintId: 'CMP-10244' },
];

export const officerComplaints = complaints.map(c => ({ ...c, officerNote: '' }));

export const adminStats = {
  totalComplaints: 124582,
  todayComplaints: 312,
  pending: 18230,
  resolved: 98420,
  critical: 245,
  slaBreach: 78,
  departments: 24,
  officers: 186,
};

export const publicStats = {
  totalComplaints: '1,24,582',
  resolved: '98,420',
  inProgress: '18,230',
  departments: '24',
};

export const complaintsByCategory = [
  { name: 'Road Infrastructure', value: 342 },
  { name: 'Water Supply', value: 215 },
  { name: 'Electricity', value: 189 },
  { name: 'Sanitation', value: 274 },
  { name: 'Public Health', value: 98 },
  { name: 'Parks', value: 67 },
];

export const complaintsByDept = [
  { name: 'Road Maintenance', complaints: 342, resolved: 240 },
  { name: 'Water Supply', complaints: 215, resolved: 158 },
  { name: 'Electricity', complaints: 189, resolved: 142 },
  { name: 'Sanitation', complaints: 274, resolved: 175 },
  { name: 'Public Health', complaints: 98, resolved: 72 },
];

export const complaintsOverTime = [
  { month: 'Mar', complaints: 980, resolved: 820 },
  { month: 'Apr', complaints: 1120, resolved: 950 },
  { month: 'May', complaints: 1340, resolved: 1100 },
  { month: 'Jun', complaints: 1180, resolved: 1020 },
  { month: 'Jul', complaints: 1450, resolved: 1230 },
  { month: 'Aug', complaints: 1620, resolved: 1310 },
];

export const resolutionRate = [
  { dept: 'Electricity', rate: 91 },
  { dept: 'Road', rate: 83 },
  { dept: 'Water Supply', rate: 79 },
  { dept: 'Sanitation', rate: 76 },
  { dept: 'Health', rate: 88 },
];

export const officers = [
  { id: 'OFF-045', name: 'Suresh Patil', employeeId: 'EMP-2045', department: 'Road Maintenance', activeCases: 12, resolved: 145, status: 'active', email: 'suresh.patil@gov.mh.in' },
  { id: 'OFF-032', name: 'Anil Deshmukh', employeeId: 'EMP-2032', department: 'Water Supply', activeCases: 8, resolved: 98, status: 'active', email: 'anil.deshmukh@gov.mh.in' },
  { id: 'OFF-018', name: 'Ganesh More', employeeId: 'EMP-2018', department: 'Electricity', activeCases: 15, resolved: 210, status: 'active', email: 'ganesh.more@gov.mh.in' },
  { id: 'OFF-061', name: 'Priya Jadhav', employeeId: 'EMP-2061', department: 'Sanitation', activeCases: 20, resolved: 87, status: 'active', email: 'priya.jadhav@gov.mh.in' },
  { id: 'OFF-023', name: 'Rakesh Sawant', employeeId: 'EMP-2023', department: 'Public Health', activeCases: 5, resolved: 62, status: 'inactive', email: 'rakesh.sawant@gov.mh.in' },
];

export const slaConfig = [
  { priority: 'Critical', hours: 24, label: '24 Hours' },
  { priority: 'High', hours: 72, label: '3 Days' },
  { priority: 'Medium', hours: 168, label: '7 Days' },
  { priority: 'Low', hours: 360, label: '15 Days' },
];

export const faqs = [
  {
    question: 'How do I register a complaint?',
    answer: 'Click on "Register a Complaint" on the home page. Log in or create an account. Fill in the complaint details, location, and upload any evidence. Review and submit.',
  },
  {
    question: 'How do I track my complaint?',
    answer: 'You can track your complaint by entering your Complaint ID in the Track Complaint section on the home page. Alternatively, log in to your account and view My Complaints.',
  },
  {
    question: 'How long does it take to resolve a complaint?',
    answer: 'Resolution times depend on the priority level. Critical complaints are addressed within 24 hours. High priority within 3 days. Medium within 7 days, and Low within 15 days.',
  },
  {
    question: 'Can I upload photos with my complaint?',
    answer: 'Yes. You can upload photos, videos, and documents as evidence when submitting a complaint. This helps officers understand the issue better.',
  },
  {
    question: 'What happens after I submit a complaint?',
    answer: 'Your complaint is reviewed by an admin, assigned to the relevant department, and an officer investigates. You will receive notifications at each step.',
  },
  {
    question: 'Can I reopen a closed complaint?',
    answer: 'Yes. If your issue is not properly resolved, you can reopen the complaint. Go to your complaint details page and click "Reopen Complaint".',
  },
];
