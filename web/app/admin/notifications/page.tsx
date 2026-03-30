'use client';
import { useState } from 'react';

export default function NotificationsAdmin() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState('');

  const sendPush = async () => {
    setStatus('Sending...');
    try {
      const res = await fetch('http://127.0.0.1:3000/api/admin/push', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer default_secret'
        },
        body: JSON.stringify({ title, body })
      });
      const data = await res.json();
      if (data.success) {
        setStatus(`Successfully sent to ${data.sent} devices.`);
        setTitle('');
        setBody('');
      } else {
        setStatus(`Error: ${data.error}`);
      }
    } catch (err) {
      setStatus('Network error occurred.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl mt-4">Broadcast Notification</h1>
      
      <div className="glass-panel max-w-lg">
        <h3 className="text-xl mb-4 text-green">Compose Message</h3>
        <p className="text-secondary text-sm mb-4">
          This message will be instantly sent to all mobile users who have enabled push notifications.
        </p>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm text-secondary">Notification Title</span>
            <input 
              type="text" 
              className="p-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md text-white" 
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 8, color: '#fff', padding: 12 }}
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="e.g. Breaking News" 
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-secondary">Notification Body</span>
            <textarea 
              rows={4}
              className="p-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md text-white" 
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 8, color: '#fff', padding: 12 }}
              value={body} 
              onChange={e => setBody(e.target.value)} 
              placeholder="Provide context for the alert..." 
            />
          </label>
          <button className="btn-primary" style={{ background: 'var(--accent-green)', marginTop: 8 }} onClick={sendPush}>
            Send to all users
          </button>
          {status && <p className="text-sm text-center text-secondary mt-2">{status}</p>}
        </div>
      </div>
    </div>
  );
}
