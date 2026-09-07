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

export const complaints = [];

export const notifications = [];

export const officerComplaints = [];

export const adminStats = {
  totalComplaints: 0,
  todayComplaints: 0,
  pending: 0,
  resolved: 0,
  critical: 0,
  slaBreach: 0,
  departments: 8,
  officers: 5,
};

export const publicStats = {
  totalComplaints: '0',
  resolved: '0',
  inProgress: '0',
  departments: '8',
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
