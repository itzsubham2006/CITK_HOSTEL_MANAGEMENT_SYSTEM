'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function FeedbackPage() {
  const [submitted, setSubmitted] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    setName(formData.get('username') as string || '')
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
    }, 500)
  }

  if (submitted) {
    return (
      <div className="thankyou" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '80px' }}>
        <div className="container3" style={{ maxWidth: '700px' }}>
          <h1 style={{ fontSize: '55px', fontWeight: 700, color: 'black', textAlign: 'center' }}>
            Thank <span style={{ color: 'green' }}>You</span> {name}!
          </h1>
          <p style={{ marginTop: '20px', fontSize: '18px', color: 'black', textAlign: 'center', lineHeight: 1.6 }}>
            Your message has been received successfully.<br />
            We&apos;ll get back to you as soon as possible.
          </p>
          <div className="back-home-btn" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Link 
              href="/" 
              className="btn" 
              style={{
                display: 'inline-block',
                marginTop: '40px',
                padding: '12px 28px',
                border: '1px solid #329e2e',
                color: 'black',
                borderRadius: '8px',
                textDecoration: 'none',
              }}
            >
              Go Back Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="feedbackk">
      <section className="card card_feed">
        <h2 className="feedback-heading">Feedback Form</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input type="text" name="username" required />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" required />
          </div>

          <div className="form-group">
            <label>Feedback</label>
            <input type="text" name="feedback" required />
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </section>
    </div>
  )
}
