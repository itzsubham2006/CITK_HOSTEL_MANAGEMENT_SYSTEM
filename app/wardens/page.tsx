export const metadata = {
  title: 'CITK HOSTEL MANAGEMENT SYSTEM | Hostel Wardens',
}

const wardens = [
  {
    name: 'Dr. Shafi Kamal Rahman',
    initials: 'SR',
    hostel: 'Sujit Narzary (SNM) Boys Hostel',
    phone: '+91 9957000980',
    rawPhone: '9957000980',
    email: 'shafi@cit.ac.in',
    color: 'linear-gradient(135deg, #059669, #065f46)',
  },
  {
    name: 'Mr. Jackie Brahma',
    initials: 'JB',
    hostel: 'Sujit Narzary (SNM) Boys Hostel',
    phone: '+91 7086261226',
    rawPhone: '7086261226',
    email: 'jackie@cit.ac.in',
    color: 'linear-gradient(135deg, #2563eb, #1e40af)',
  },
  {
    name: 'Dr. Apurba Kr. Raibaruah',
    initials: 'AR',
    hostel: 'Basiram Jhwlao (BJ) Boys Hostel',
    phone: '+91 9365760309',
    rawPhone: '9365760309',
    email: 'apurba@cit.ac.in',
    color: 'linear-gradient(135deg, #d97706, #92400e)',
  },
  {
    name: 'Mr. Bikramjit Choudhury',
    initials: 'BC',
    hostel: 'Sikhna Jhwlao (SJ) Boys Hostel',
    phone: '+91 8638005168',
    rawPhone: '8638005168',
    email: 'bikramjit@cit.ac.in',
    color: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
  },
  {
    name: 'Dr. Manasi Buzar Baruah',
    initials: 'MB',
    hostel: 'Gambari Sikhla (GS) Girls Hostel',
    phone: '+91 9435120216',
    rawPhone: '9435120216',
    email: 'manasi@cit.ac.in',
    color: 'linear-gradient(135deg, #db2777, #9d174d)',
  },
]

export default function WardensPage() {
  return (
    <section className="warden-section">
      <div className="section-title">
        <h1>Hostel Wardens</h1>
        <p>Central Institute of Technology Kokrajhar — Administrative &amp; Pastoral Support</p>
      </div>

      <div style={{ maxWidth: '850px', margin: '0 auto' }}>
        {wardens.map((warden, index) => (
          <div className="warden-card" key={index}>
            <div className="warden-img">
              <div
                className="warden-avatar"
                style={{ background: warden.color }}
                aria-hidden="true"
              >
                {warden.initials}
              </div>
            </div>

            <div className="warden-info">
              <h2>{warden.name}</h2>
              <div>
                <span className="warden-hostel-badge">🏢 {warden.hostel}</span>
              </div>

              <div className="warden-contacts">
                <a
                  href={`tel:${warden.rawPhone}`}
                  className="warden-contact-pill"
                  title={`Call ${warden.name}`}
                >
                  <span>📞</span>
                  <span>{warden.phone}</span>
                </a>

                <a
                  href={`mailto:${warden.email}`}
                  className="warden-contact-pill"
                  title={`Send email to ${warden.name}`}
                >
                  <span>✉️</span>
                  <span>{warden.email}</span>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
