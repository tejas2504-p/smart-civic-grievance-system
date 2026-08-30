import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr, timeStr) {
  if (!dateStr) return '—';
  return `${formatDate(dateStr)}${timeStr ? ` at ${timeStr}` : ''}`;
}

export function getStatusClass(status) {
  const map = {
    'Submitted': 'status-submitted',
    'Under Review': 'status-review',
    'Assigned': 'status-assigned',
    'In Progress': 'status-inprogress',
    'Resolved': 'status-resolved',
    'Closed': 'status-closed',
    'Reopened': 'status-reopened',
    'Escalated': 'status-escalated',
  };
  return map[status] || 'status-submitted';
}

export function getPriorityClass(priority) {
  const map = {
    'Critical': 'priority-critical',
    'High': 'priority-high',
    'Medium': 'priority-medium',
    'Low': 'priority-low',
  };
  return map[priority] || '';
}

export function getPriorityIcon(priority) {
  const map = {
    'Critical': '🔴',
    'High': '🟠',
    'Medium': '🟡',
    'Low': '🟢',
  };
  return map[priority] || '⚪';
}

export function getStatusIcon(status) {
  const map = {
    'Submitted': '📋',
    'Under Review': '🔍',
    'Assigned': '👤',
    'In Progress': '⚙️',
    'Resolved': '✅',
    'Closed': '🔒',
    'Reopened': '🔄',
    'Escalated': '⚠️',
  };
  return map[status] || '📋';
}

export function truncate(str, maxLen = 60) {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}

export function generateComplaintId() {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `CMP-${num}`;
}

export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (new Date() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
