export default function DeleteAccountPage() {
  return (
    <div className="container section">
      <div className="panel">
        <h1 className="section-title">Delete Account</h1>
        <p className="section-sub">You can permanently delete your Kurdex account here.</p>
        <div style={{ display: 'grid', gap: 16, marginTop: 24 }}>
          <p>
            If you created an account in the app, you can delete it directly from your Profile screen.
            This removes your account data and active sessions.
          </p>
          <p>
            If you cannot access the app, email support@kurdex.app with your account email and the subject
            "Delete my account".
          </p>
        </div>
      </div>
    </div>
  );
}
