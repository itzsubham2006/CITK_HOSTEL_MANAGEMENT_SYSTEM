import Link from 'next/link'

export default function HomePage() {
  return (
    <>
      {/* Collage Slider */}
      <section className="collage-slider">
        <div className="collage-track">
          {[1, 2, 3].map((track) => (
            <div className="collage" key={track}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/bg-2.jpg" alt="Hostel Campus" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/gal-1.jpg" alt="Hostel Activity 1" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/gal-2.jpg" alt="Hostel Activity 2" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/gal-3.jpg" alt="Hostel Activity 3" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/gal-4.jpg" alt="Hostel Activity 4" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/gal-5.jpg" alt="Hostel Activity 5" />
            </div>
          ))}
        </div>

        <div className="collage-text">
          Campus Life • Hostel Events • Student Activities
        </div>
      </section>

      <div className="same">
        <main className="container">
          <section className="welcome-section">
            <h2>Welcome to CIT Hostel Management Portal</h2>
          </section>
        </main>

        <div className="foto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/cit.jpg" alt="CIT Kokrajhar Campus" />
        </div>
      </div>

      <section className="about-wrapper">
        <div className="about-card">
          <h2>About the System</h2>

          <div className="about-content">
            <div className="about-text">
              <p>
                The <strong>CITK Hostel Management System</strong> is a centralized web-based
                platform developed to efficiently manage and resolve hostel-related issues at the{' '}
                <strong>Central Institute of Technology, Kokrajhar (CITK)</strong>.
                The system aims to improve communication between hostel residents and hostel
                authorities while ensuring transparency, accountability, and timely resolution
                of reported problems.
              </p>

              <p>
                Central Institute of Technology, Kokrajhar is a centrally funded technical institute
                established by the Government of India to provide quality technical and vocational
                education. As a residential campus, CITK accommodates students from diverse regions
                across the country, making effective hostel administration a vital component of
                campus life.
              </p>

              <p>
                Traditionally, hostel issues such as electrical faults, water supply problems,
                sanitation concerns, maintenance requirements, and internet connectivity issues
                were reported through manual or informal methods. These approaches often led to
                delayed responses and lack of proper tracking. The Hostel Issue Management System
                addresses these challenges by providing a structured digital mechanism for issue
                reporting and monitoring.
              </p>

              <p>
                Through this platform, students can submit detailed complaints and track their
                resolution status in real time. Hostel wardens and administrators can review,
                prioritize, and resolve issues efficiently using a centralized dashboard. This
                streamlined workflow reduces administrative burden and improves overall hostel
                service quality.
              </p>

              <p>
                The CITK Hostel Management System reflects the institute’s commitment to
                digital transformation, efficient governance, and student welfare. It contributes
                to creating a safer, cleaner, and more comfortable living environment for hostel
                residents.
              </p>
            </div>
          </div>

          <div className="about-highlights">
            <div className="highlight-box">
              <i className="fa-solid fa-eye"></i>
              <h4>Vision</h4>
              <p>
                To create a transparent, efficient, and student-friendly system for
                managing hostel-related issues at CITK.
              </p>
            </div>

            <div className="highlight-box">
              <i className="fa-solid fa-bullseye"></i>
              <h4>Objective</h4>
              <p>
                To provide a centralized digital platform for timely reporting,
                monitoring, and resolution of hostel complaints.
              </p>
            </div>

            <div className="highlight-box">
              <i className="fa-solid fa-thumbs-up"></i>
              <h4>Benefits</h4>
              <p>
                Faster issue resolution, improved communication, accountability, and
                enhanced hostel living experience for students.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
