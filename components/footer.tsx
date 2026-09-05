import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="citk-footer">
      <div className="footer-container">
        <div className="footer-about">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/citk_logo.png" alt="CITK Logo" />
          <h3>Central Institute of Technology</h3>
          <p>Kokrajhar - 783370, Assam, India</p>
          <p className="email">📧 citkhostel@cit.ac.in</p>

          <div className="social-icons">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              <i className="fab fa-twitter"></i>
            </a>
          </div>
        </div>

        <div className="footer-links">
          <h4>Quick Links</h4>
          <ul>
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <Link href="/my-issues">My Reported Issue</Link>
            </li>
            <li>
              <Link href="/wardens">Hostel Wardens</Link>
            </li>
            <li>
              <Link href="/about">About</Link>
            </li>
          </ul>
        </div>

        <div className="footer-links">
          <h4>Important Links</h4>
          <ul>
            <li>
              <Link href="/anti-ragging">Anti Ragging</Link>
            </li>
            <li>
              <Link href="/report-issue">Report Issue</Link>
            </li>
            <li>
              <Link href="/facilities">Hostel Rules</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p style={{ lineHeight: '1.4' }}>
          This website is developed for training and academic purposes only.
          It is not an official system of Central Institute of Technology, Kokrajhar.
          Official deployment will be considered only after institutional approval.
        </p>
        <p className="copyright">
          © {new Date().getFullYear()} Central Institute of Technology Kokrajhar
        </p>
      </div>
    </footer>
  )
}
