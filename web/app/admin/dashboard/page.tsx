'use client';
import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ pushTokens: 0, dbSize: '-' });

  useEffect(() => {
    // Note: To make this robust, the Admin dashboard needs the Bearer secret.
    // For this demonstration, we'll provide the default secret.
    fetch('http://127.0.0.1:3000/api/admin/stats', {
      headers: { Authorization: "Bearer default_secret" }
    })
      .then(r => r.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl mt-4">System Overview</h1>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="glass-panel">
          <h3 className="text-secondary text-sm">Active Push Tokens</h3>
          <p className="text-4xl mt-2">{stats.pushTokens || 0}</p>
        </div>
      </div>
    </div>
  );
}
