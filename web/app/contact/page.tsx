export default function ContactPage() {
  return (
    <div className="container section">
      <div className="panel">
        <h1 className="section-title">Contact</h1>
        <p className="section-sub">We respond within 1-2 business days.</p>
        <form style={{ display: 'grid', gap: 16, marginTop: 24 }}>
          <input className="form-control" placeholder="Your name" />
          <input className="form-control" placeholder="Email" />
          <textarea className="form-control" rows={4} placeholder="How can we help?" />
          <button className="btn btn-primary" type="button">Send Message</button>
        </form>
      </div>
    </div>
  );
}
