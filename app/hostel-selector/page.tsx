import Link from 'next/link'

export const metadata = {
  title: 'CITK HOSTEL MANAGEMENT SYSTEM | Hostel Selector',
}

const hostels = [
  { name: 'SJ Hostel', code: 'SJ', type: 'boys', badge: 'Boys Hostel' },
  { name: 'JD Hostel', code: 'JD', type: 'boys', badge: 'Boys Hostel' },
  { name: 'BJ Hostel', code: 'BJ', type: 'boys', badge: 'Boys Hostel' },
  { name: 'SNM Hostel', code: 'SNM', type: 'boys', badge: 'Boys Hostel' },
  { name: 'Bakhoungri', code: 'Bakhoungri', type: 'girls', badge: 'Girls Hostel' },
  { name: 'Gambari', code: 'Gambari', type: 'girls', badge: 'Girls Hostel' },
]

export default function HostelSelectorPage() {
  return (
    <section className="hostel-selector-section" style={{ padding: '40px 20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 className="section-title">🏠 Select Hostel</h2>
      <p className="section-subtitle">Choose a hostel to manage rooms and students</p>

      <div className="hostel-grid">
        {hostels.map((h) => (
          <Link
            key={h.code}
            href={`/hostel-rooms?hostel=${h.code}`}
            className="hostel-card"
          >
            <h3>{h.name}</h3>
            <span className={`badge ${h.type}`}>{h.badge}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
