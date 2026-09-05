export const metadata = {
  title: 'CITK HOSTEL MANAGEMENT SYSTEM | Hostel Wardens',
}

const wardens = [
  {
    name: 'Dr. Shafi Kamal Rahman',
    hostel: 'Sujit Narzary (SNM) Boys Hostel',
    phone: '9957000980',
    email: 'shafi@cit.ac.in',
    img: '/images/wardens/warden1.jpg',
  },
  {
    name: 'Mr. Jackie Brahma',
    hostel: 'Sujit Narzary (SNM) Boys Hostel',
    phone: '7086261226',
    email: 'jackie@cit.ac.in',
    img: '/images/wardens/warden1.jpg',
  },
  {
    name: 'Dr. Apurba Kr. Raibaruah',
    hostel: 'Basiram Jhwlao (BJ) Boys Hostel',
    phone: '9365760309',
    email: 'apurba@cit.ac.in',
    img: '/images/wardens/warden1.jpg',
  },
  {
    name: 'Mr. Bikramjit Choudhury',
    hostel: 'Sikhna Jhwlao(SJ) Boys Hostel',
    phone: '8638005168',
    email: 'bikramjit@cit.ac.in',
    img: '/images/wardens/warden1.jpg',
  },
  {
    name: 'Dr. Manasi Buzar Baruah',
    hostel: 'Gambari Sikhla(GS) Girls Hostel',
    phone: '9435120216',
    email: 'manasi@cit.ac.in',
    img: '/images/wardens/warden1.jpg',
  },
]

export default function WardensPage() {
  return (
    <section className="warden-section">
      <div className="section-title">
        <h1>Hostel Wardens</h1>
        <p>Central Institute of Technology Kokrajhar</p>
      </div>

      {wardens.map((warden, index) => (
        <div className="warden-card" key={index}>
          <div className="warden-img">
            <img src={warden.img} alt={warden.name} />
          </div>
          <div className="warden-info">
            <h2>{warden.name}</h2>
            <span><strong>{warden.hostel}</strong></span>
            <p>📞 {warden.phone}</p>
            <p>✉️ {warden.email}</p>
          </div>
        </div>
      ))}
    </section>
  )
}
