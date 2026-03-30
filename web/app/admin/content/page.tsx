'use client';
import { useState, useEffect } from 'react';

export default function ContentManagement() {
  const [keyToEdit, setKeyToEdit] = useState('');
  const [valueToEdit, setValueToEdit] = useState('');
  const [status, setStatus] = useState('');
  const [activeContent, setActiveContent] = useState<any[]>([]);

  const fetchContent = () => {
    fetch('http://127.0.0.1:3000/api/admin/content', {
      headers: { Authorization: "Bearer default_secret" }
    })
      .then(r => r.json())
      .then(setActiveContent)
      .catch(console.error);
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleSave = async () => {
    setStatus('Saving...');
    try {
      const res = await fetch('http://127.0.0.1:3000/api/admin/content', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer default_secret'
        },
        body: JSON.stringify({ key: keyToEdit, value: valueToEdit })
      });
      const data = await res.json();
      if (data.success) {
        setStatus('Saved successfully');
        setKeyToEdit('');
        setValueToEdit('');
        fetchContent();
      } else {
        setStatus('Error: ' + data.error);
      }
    } catch (err) {
      setStatus('Failed to upload');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl mt-4">Content Management</h1>
      
      <div className="glass-panel max-w-lg">
        <h3 className="text-xl mb-4 text-gold">Create/Update Block</h3>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm text-secondary">Content Key (e.g. "home_banner")</span>
            <input 
              type="text" 
              className="p-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md text-white" 
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 8, color: '#fff', padding: 12 }}
              value={keyToEdit} 
              onChange={e => setKeyToEdit(e.target.value)} 
              placeholder="Enter unique key" 
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-secondary">Content Value</span>
            <textarea 
              rows={4}
              className="p-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md text-white" 
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 8, color: '#fff', padding: 12 }}
              value={valueToEdit} 
              onChange={e => setValueToEdit(e.target.value)} 
              placeholder="Enter text or HTML..." 
            />
          </label>
          <button className="btn-primary mt-2 flex justify-center items-center" onClick={handleSave}>
            Save Content
          </button>
          {status && <p className="text-sm text-center text-secondary">{status}</p>}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-xl mb-4">Active Content Blocks</h3>
        <div className="grid gap-4">
          {activeContent.map((item, idx) => (
            <div key={idx} className="glass-panel flex justify-between items-center">
              <div>
                <p className="font-bold text-lg">{item.key}</p>
                <p className="text-sm text-secondary truncate max-w-md">{item.value}</p>
              </div>
              <button className="text-sm text-secondary hover:text-white" onClick={() => {
                setKeyToEdit(item.key);
                setValueToEdit(item.value);
              }}>
                Edit
              </button>
            </div>
          ))}
          {activeContent.length === 0 && <p className="text-muted">No content blocks found.</p>}
        </div>
      </div>
    </div>
  );
}
