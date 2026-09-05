'use client'

import { useEffect, useState } from 'react'

export default function FacilitiesPage() {
  const [counts, setCounts] = useState({ hostels: 0, boys: 0, girls: 0, capacity: 0 })

  useEffect(() => {
    const targets = { hostels: 8, boys: 5, girls: 3, capacity: 503 }
    const duration = 1000
    const steps = 30
    const stepTime = duration / steps
    let currentStep = 0

    const timer = setInterval(() => {
      currentStep++
      const progress = currentStep / steps
      setCounts({
        hostels: Math.min(Math.round(targets.hostels * progress), targets.hostels),
        boys: Math.min(Math.round(targets.boys * progress), targets.boys),
        girls: Math.min(Math.round(targets.girls * progress), targets.girls),
        capacity: Math.min(Math.round(targets.capacity * progress), targets.capacity),
      })

      if (currentStep >= steps) {
        clearInterval(timer)
      }
    }, stepTime)

    return () => clearInterval(timer)
  }, [])

  return (
    <>
      <section className="hostel-slider">
        <h2 style={{ color: '#2e7d32', display: 'inline-block', backgroundColor: '#d7e6d0', borderRadius: '10px', margin: '20px' }}>
          Life at CIT Hostels
        </h2>

        <div className="slider">
          <div className="slides">
            <img src="/images/hostel.jpg" alt="Hostel" />
            <img src="/images/hostel2.jpeg" alt="Hostel 2" />
            <img src="/images/snm_hostel.webp" alt="SNM Hostel" />
            <img src="/images/bg-3.jpg" alt="Campus BG" />
            <img src="/images/bj.jpg" alt="BJ Hostel" />
            <img src="/images/snm_hostel.webp" alt="SNM Hostel" />
            <img src="/images/hostel2.jpeg" alt="Hostel 2" />
            <img src="/images/hostel3.jpeg" alt="Hostel 3" />
          </div>
        </div>
      </section>

      <section className="hostel-showcase">
        <div className="hs-header">
          <h1 style={{ color: '#2e7d32', display: 'inline-block', backgroundColor: '#d7e6d0', borderRadius: '10px' }}>
            Hostel Facilities
          </h1>
          <p>
            A modern, secure, and student-friendly residential ecosystem at Central Institute of Technology Kokrajhar.
          </p>
        </div>

        {/* Stats */}
        <div className="hs-stats">
          <div className="stat-box">
            <h3 className="counter">{counts.hostels}</h3>
            <span>Total Hostels</span>
          </div>
          <div className="stat-box">
            <h3 className="counter">{counts.boys}</h3>
            <span>Boys Hostels</span>
          </div>
          <div className="stat-box">
            <h3 className="counter">{counts.girls}</h3>
            <span>Girls Hostels</span>
          </div>
          <div className="stat-box">
            <h3 className="counter">{counts.capacity}</h3>
            <span>Total Capacity</span>
          </div>
        </div>

        {/* Description */}
        <div className="hs-description">
          <p>
            The Institute maintains separate hostels for boys and girls across different parts of Kokrajhar town, along with many hostels inside the campus. These hostels provide a safe and comfortable living environment, especially for outstation students.
          </p>
          <p>
            With the introduction of first-year degree programs and growing student intake, the Institute is continuously expanding hostel facilities to accommodate more students efficiently.
          </p>
        </div>

        {/* Facilities Grid */}
        <div className="hs-facilities">
          <div className="facility-card">🌐 <span>High-Speed Internet (Ethernet)</span></div>
          <div className="facility-card">🪑 <span>Study Table &amp; Comfortable Chair</span></div>
          <div className="facility-card">🛏️ <span>Bed &amp; Personal Cupboard</span></div>
          <div className="facility-card">🚰 <span>Safe Drinking Water (Water Filter)</span></div>
          <div className="facility-card">🍽️ <span>Large Mess &amp; Dining Hall</span></div>
          <div className="facility-card">🎮 <span>Activity &amp; Indoor Games Room</span></div>
        </div>
      </section>
    </>
  )
}
