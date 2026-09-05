import Link from 'next/link'

export const metadata = {
  title: 'CITK HOSTEL MANAGEMENT SYSTEM | Help',
}

export default function HelpPage() {
  return (
    <section className="help-section" style={{ marginBottom: '50px' }}>
      <div className="help-container">
        <h2>Need Help?</h2>
        <p className="help-subtitle">
          We’re here to guide you through the Hostel Management System.
        </p>

        <div className="help-cards">
          <div className="help-card">
            <h4>📌 Reporting an Issue</h4>
            <p>
              Go to <Link href="/report-issue"><strong>Report Issue</strong></Link>, select the correct category,
              describe the problem clearly, and upload an image if available. If you want to delete your complaints then please visit{' '}
              <Link href="/my-issues"><strong>My Reported Issue</strong></Link> to delete, view your complaint(s).
            </p>
          </div>

          <div className="help-card">
            <h4>📄 Track Your Issues</h4>
            <p>
              Visit <Link href="/my-issues"><strong>My Reported Issue</strong></Link> to check the current
              status and updates of your submitted complaints.
            </p>
          </div>

          <div className="help-card">
            <h4>🔔 Notifications</h4>
            <p>
              Stay updated with issue progress through the{' '}
              <Link href="/notifications"><strong>Notifications</strong></Link> section.
            </p>
          </div>

          <div className="help-card">
            <h4>Hostel Diary</h4>
            <p>
              Hostel Diary is a section where everyone can send their hostel memories in real time.
              To delete your pictures uploaded in the Hostel Diary, please visit{' '}
              <Link href="/profile"><strong>My Profile</strong></Link> section.
            </p>
          </div>

          <div className="help-card">
            <h4>👤 Profile &amp; Security</h4>
            <p>
              Keep your profile details correct and do not share your
              login credentials with anyone.
            </p>
          </div>

          <div className="help-card">
            <h4><i className="fa-brands fa-internet-explorer"></i> Internet and Connections</h4>
            <p>
              CIT Kokrajhar provides free Internet (Wifi / LAN) access across whole campus and all the hostels of CIT.
            </p>
          </div>
        </div>

        <div className="help-note">
          <strong>Note:</strong> Report only genuine hostel-related issues.
          Responsible reporting helps maintain a better living environment.
        </div>
      </div>
    </section>
  )
}
