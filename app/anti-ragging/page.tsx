'use client'

import { useState } from 'react'

export default function AntiRaggingPage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
    }, 600)
  }

  return (
    <>
      {/* HERO IMAGE */}
      <section className="anti-hero">
        <div className="hero-overlay">
          <h1>Say NO to Ragging</h1>
          <p>Ragging is a punishable offence. Help us keep the campus safe.</p>
        </div>
      </section>

      <div className="anti-ragging-container" style={{ marginBottom: '50px' }}>
        <section className="card">
          <h2>What is Ragging?</h2>
          <p>
            Ragging refers to any conduct by a student or group of students that causes or is likely to cause
            physical, psychological or emotional harm to another student. This includes bullying, harassment,
            teasing, abuse, or intimidation in any form.
          </p>
          <p>
            As per UGC regulations, ragging is a <strong>serious criminal offence</strong> and is strictly prohibited in all
            educational institutions in India.
          </p>
        </section>

        <section className="card">
          <h2>Anti-Ragging Awareness</h2>
          <div className="image-grid">
            <img src="/images/rag_4.webp" alt="Anti Ragging Banner" />
            <img src="/images/rag_1.webp" alt="UGC Anti Ragging" />
            <img src="/images/rag_2.webp" alt="Stop Ragging" />
            <img src="/images/rag_3.webp" alt="Ragging Awareness" />
          </div>
        </section>

        <section className="card">
          <h2>Why Anti-Ragging is Important</h2>
          <ul>
            <li>Ensures a safe and healthy campus environment</li>
            <li>Protects students’ dignity and mental health</li>
            <li>Encourages mutual respect among seniors and juniors</li>
            <li>Prevents physical and psychological abuse</li>
          </ul>
        </section>

        <section className="card">
          <h2>Legal Consequences of Ragging</h2>
          <p>Students found guilty of ragging may face:</p>
          <ul>
            <br />
            <li>Suspension or expulsion from the institution</li>
            <li>Cancellation of admission</li>
            <li>Withholding of results or scholarships</li>
            <li>Police action under IPC provisions</li>
          </ul>
        </section>

        {/* HELPLINE */}
        <section className="card helpline">
          <h2>National Anti-Ragging Helpline</h2>
          <p><strong>24×7 Toll-Free:</strong> 1800-180-5522</p>
          <p><strong>Email:</strong> <a href="mailto:helpline@antiragging.in">helpline@antiragging.in</a></p>
          <p><strong>Website:</strong>{' '}
            <a href="https://www.antiragging.in" target="_blank" rel="noreferrer">www.antiragging.in</a>
          </p>
          <p><strong>Anti-Ragging Form(Official):</strong>{' '}
            <a href="https://antiragging.in/affidavit_affiliated_form.php" target="_blank" rel="noreferrer">Click here</a>
          </p>
        </section>

        {/* FORM */}
        <section className="card">
          <h2>Anti-Ragging Complaint Form</h2>

          {submitted ? (
            <div style={{ padding: '20px', backgroundColor: '#e8f5e9', border: '1px solid #c8e6c9', borderRadius: '8px', color: '#2e7d32', textAlign: 'center' }}>
              <i className="fa-solid fa-circle-check" style={{ fontSize: '32px', marginBottom: '10px', display: 'block' }}></i>
              <h3>Complaint Submitted Securely</h3>
              <p>Your grievance has been forwarded to the Anti-Ragging Committee with highest priority.</p>
              <button 
                type="button" 
                className="btn-submit" 
                style={{ marginTop: '15px', display: 'inline-block' }} 
                onClick={() => setSubmitted(false)}
              >
                Submit Another Complaint
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" name="full_name" required />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input type="email" name="email" required />
              </div>

              <div className="form-group">
                <label>Mobile Number</label>
                <input type="text" name="mobile" required />
              </div>

              <div className="form-group">
                <label>Hostel / Department</label>
                <input type="text" name="college" required />
              </div>

              <div className="form-group">
                <label>Complaint Details</label>
                <textarea name="complaint" rows={5} required></textarea>
              </div>

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Complaint'}
              </button>
            </form>
          )}
        </section>
      </div>
    </>
  )
}
