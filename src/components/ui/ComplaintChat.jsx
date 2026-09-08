import React, { useState, useEffect, useRef } from 'react';
import { getSocket } from '../../lib/socket';
import { Send, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';

export default function ComplaintChat({ complaintId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    if (!user || !complaintId) return;

    // Fetch message history
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/complaints/${complaintId}/messages`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        const data = await res.json();
        if (data.success) {
          setMessages(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();

    // Setup real-time socket
    const socket = getSocket();
    socket.emit('join_complaint', complaintId);
    
    const handleNewMessage = (msg) => {
      // Ensure we don't duplicate
      setMessages(prev => {
        if (prev.find(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    };
    
    socket.on('new_message', handleNewMessage);
    
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [user, complaintId]);

  useEffect(() => {
    // Scroll to bottom when messages update
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    
    const currentInput = input.trim();
    setInput('');
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/complaints/${complaintId}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}` 
        },
        body: JSON.stringify({ message: currentInput })
      });
      const data = await res.json();
      if (!data.success) {
        console.error('Failed to send:', data.message);
        setInput(currentInput); // revert input on failure
      }
    } catch (err) {
      console.error(err);
      setInput(currentInput);
    }
  };

  if (!user) {
    return (
      <div style={{ background: '#f8fafc', padding: '24px', borderRadius: 8, textAlign: 'center', border: '1px solid var(--color-border)' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Please log in to communicate directly with the resolving officer.</p>
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, display: 'flex', flexDirection: 'column', height: 400, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
        <h3 style={{ fontWeight: 650, fontSize: '0.9375rem', margin: 0 }}>Complaint Communication</h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0 }}>Messages are securely recorded in the case log.</p>
      </div>
      
      <div style={{ flex: 1, padding: 16, overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.8rem', padding: 20 }}>Loading messages...</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.8rem', padding: 20, margin: 'auto' }}>No messages yet. Send a message to start communicating.</div>
        ) : (
          messages.map(msg => {
            const isMe = msg.senderId === user._id;
            const isOfficer = msg.role === 'officer' || msg.role === 'admin';
            
            return (
              <div key={msg._id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginBottom: 4, padding: '0 4px' }}>
                  {isMe ? 'You' : msg.senderName} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div style={{ 
                  background: isMe ? 'var(--color-primary)' : (isOfficer ? '#e0f2fe' : '#fff'),
                  color: isMe ? '#fff' : 'var(--color-text-primary)',
                  padding: '8px 12px',
                  borderRadius: 12,
                  border: isMe ? 'none' : '1px solid var(--color-border)',
                  borderBottomRightRadius: isMe ? 2 : 12,
                  borderBottomLeftRadius: isMe ? 12 : 2,
                  maxWidth: '85%',
                  fontSize: '0.875rem',
                  lineHeight: 1.4,
                  wordBreak: 'break-word'
                }}>
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div style={{ padding: '12px', borderTop: '1px solid var(--color-border)', background: '#fff' }}>
        <form onSubmit={sendMessage} style={{ display: 'flex', gap: 8 }}>
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a message..."
            style={{ flex: 1, padding: '8px 12px', borderRadius: 20, border: '1px solid var(--color-border)', outline: 'none', fontSize: '0.875rem' }}
            disabled={loading}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || loading}
            style={{ background: input.trim() ? 'var(--color-primary)' : 'var(--color-border)', color: '#fff', border: 'none', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'not-allowed', transition: 'background 0.2s' }}
            aria-label="Send message"
          >
            <Send size={16} style={{ marginLeft: -2 }} />
          </button>
        </form>
      </div>
    </div>
  );
}
