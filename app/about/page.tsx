import Link from 'next/link'

export const metadata = {
  title: 'CITK HOSTEL MANAGEMENT SYSTEM | About',
}

export default function AboutPage() {
  return (
    <div className="hehe">
      <div className="about_img">
        <img src="/images/bg-3.jpg" alt="CIT Kokrajhar Campus" />
      </div>

      <section className="about-wrapper" id="about_wrap">
        <div className="about-card">
          <h2>The Institute</h2>
          <div className="about-content">
            <div className="about-text">
              <p>
                The <strong>Central Institute of Technology (CIT), Kokrajhar</strong> is situated in Kokrajhar District of <strong>Bodoland Territorial Council (BTC)</strong> in Assam. CIT has been established for the basic objective of fulfilling the aspirations of the Bodo People relating to their cultural identity, language, education and overall economic development of the region and to impart Bodo youths with requisite technological and vocational training to produce the required manpower to give the impetus to economic growth of this area and to integrate the Bodo People into the mainstream of Technical and Vocational Education. It is a Centrally Funded Institute under the Ministry of Human Resource Development, Government of India.
              </p>
              <p>
                The Institute was established on the <strong>6th of December 2006</strong>. The genesis of this Institute was the memorandum of Settlement on <strong>Bodoland Territorial Council (BTC)</strong> signed between the Assam Government, the Union Government and the Bodo Liberation Tigers, on February 10, 2003, in New Delhi. The Institute is an autonomous body registered under the <strong>Societies Registration Act.</strong>, 1860 and functions under a Board of Governors (BOG).
              </p>
              <p>
                <strong>CIT</strong> is mandated to impart Technical and Vocational Education such as Information Technology, Bio-Technology, Food Processing, Rural Industries, Business Management, etc. as part of the concerted efforts being made by the Government of India and the Government of Assam to fulfill the aspirations of the Bodo people. It is thus envisioned to acquire a unique place in the field of technical education in the country through its modular and innovative academic programmes.
              </p>
              <p>
                The first batch of students was admitted in <strong>Diploma Module</strong> in 2006. Currently CIT offers Diploma courses in <strong>Computer Science Engineering (CSE), Control and Instrumentation (CAI), Electronics and Communication Engineering (ECE) and Food Processing Technology (FPT), Construction Technology and Animation and Multimedia.</strong> The degree programme was started in CIT in 2009. At present the degree programmes offered by CIT are in Computer Science and Engineering, Electronics and Communication Engineering, Instrumentation Engineering, Food Processing Technology, Civil Engineering(Construction Technology) and Information Technology
              </p>
            </div>
          </div>
        </div>
      </section>

      <div id="foto_2">
        <img src="/images/hostel2.jpeg" alt="hostel_image" />
      </div>

      <section className="about-wrapper" id="about_wrap">
        <div className="about-card">
          <h2>About the Hostels</h2>
          <div className="about-content">
            <div className="about-text">
              <p>
                The hostels at the Central Institute of Technology (CIT), Kokrajhar are categorized into boys’ and girls’ hostels. These hostels are distributed across the institute campus as well as various locations in Kokrajhar town to accommodate the growing number of students.
              </p>
              <p>
                The boys’ hostels located inside the campus include <strong>SNM</strong>, <strong>SJ</strong>, and <strong>JD</strong>, while the campus currently has <strong>one girls’ hostel</strong>, with plans underway to construct additional hostels for female students in the future.
              </p>
              <p>
                Apart from the campus hostels, several boys’ and girls’ hostels are situated in Kokrajhar town. These include <strong>Nijwm Girls Hostel</strong>, <strong>BBEC VIP Boys Hostel</strong>, <strong>Takeoff Heaven Homestay</strong>, <strong>Gwjwnpuri Boys Hostel-2</strong>, <strong>Ashish Boys PG</strong>, <strong>BJ Boys Hostel</strong>, <strong>APJ Boys Hostel (CIT)</strong>, <strong>Tirupathi Boys Hostel</strong>, and <strong>Manisha Girls Hostel</strong>.
              </p>
              <p>
                Within the campus, the institute houses Three boys’ hostels with a capacity of <strong>336+ students each, and one girls' hostel with a capacity of <strong>234+ students</strong>.</strong>
              </p>
              <p>
                Overall, CIT Kokrajhar manages a total of <strong>5+ boys’ hostels</strong> and <strong>4+ girls’ hostels</strong>, with a combined intake capacity of approximately <strong>336+ boys</strong> and <strong>234+ girls</strong>, ensuring residential facilities for students from diverse regions.
              </p>
              <p>
                Students are provided <strong>High-Speed Internet (Ethernet)</strong> and <strong>Study-Table</strong> for every student of hostel, Bed & Personal Cupboard, Safe Drinking Water, Large Mess & Dining Hall, Activity & Indoor Games Room.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="citk-hostel-wrapper" style={{ marginBottom: '60px' }}>
        {/* Gambari Girls Hostel */}
        <div className="citk-hostel-card">
          <div className="citk-hostel-image">
            <img src="/images/gambari_hostel.jpeg" alt="Gambari Girls Hostel" />
          </div>
          <div className="citk-hostel-content">
            <h2>Gambari Sikwla (GS) Girls Hostel</h2>
            <p className="citk-hostel-location">📍 Inside Campus</p>
            <p>
              Gambari Sikwla Girls Hostel is located within the CIT Kokrajhar campus,
              offering a secure and comfortable living environment with easy
              access to academic facilities.
            </p>
            <Link href="/facilities" className="citk-hostel-btn">View Hostel Details</Link>
          </div>
        </div>

        {/* Baokhungri Hostel */}
        <div className="citk-hostel-card citk-reverse">
          <div className="citk-hostel-image">
            <img src="/images/test.webp" alt="Baokhungri Girls Hostel" />
          </div>
          <div className="citk-hostel-content">
            <h2>Baokhungri Girls Hostel</h2>
            <p className="citk-hostel-location">📍 Outside Campus</p>
            <p>
              Baokhungri Girls Hostel is situated outside the campus, providing
              a calm residential atmosphere while remaining connected to CITK.
            </p>
            <Link href="/facilities" className="citk-hostel-btn">View Hostel Details</Link>
          </div>
        </div>

        {/* Basiram Jhwlao Boys Hostel */}
        <div className="citk-hostel-card">
          <div className="citk-hostel-image">
            <img src="/images/bj.jpg" alt="Basiram Jhwlao Hostel" />
          </div>
          <div className="citk-hostel-content">
            <h2>Basiram Jhwlao (BJ) Boys Hostel</h2>
            <p className="citk-hostel-location">📍 Inside Campus</p>
            <p>
              BJ Boys Hostel supports a disciplined and student-friendly
              environment, helping students focus on academics and growth.
            </p>
            <Link href="/facilities" className="citk-hostel-btn">View Hostel Details</Link>
          </div>
        </div>

        {/* Sikhna Jhwlao Boys Hostel */}
        <div className="citk-hostel-card citk-reverse">
          <div className="citk-hostel-image">
            <img src="/images/hostel.jpg" alt="Sikhna Jhwlao Hostel" />
          </div>
          <div className="citk-hostel-content">
            <h2>Sikhna Jhwlao (SJ) Boys Hostel</h2>
            <p className="citk-hostel-location">📍 Inside Campus</p>
            <p>
              SJ Boys Hostel provides structured residential facilities
              within campus to support academic excellence.
            </p>
            <Link href="/facilities" className="citk-hostel-btn">View Hostel Details</Link>
          </div>
        </div>

        {/* Sujit Narzary Boys Hostel */}
        <div className="citk-hostel-card">
          <div className="citk-hostel-image">
            <img src="/images/snm_hostel.webp" alt="Sujit Narzary Hostel" />
          </div>
          <div className="citk-hostel-content">
            <h2>Sujit Narzary (SNM) Boys Hostel</h2>
            <p className="citk-hostel-location">📍 Inside Campus</p>
            <p>
              SNM Boys Hostel offers essential amenities and a collaborative
              residential environment inside the CITK campus.
            </p>
            <Link href="/facilities" className="citk-hostel-btn">View Hostel Details</Link>
          </div>
        </div>

        {/* JD Boys Hostel */}
        <div className="citk-hostel-card citk-reverse">
          <div className="citk-hostel-image">
            <img src="/images/hostel2.jpeg" alt="JD Boys Hostel" />
          </div>
          <div className="citk-hostel-content">
            <h2>Jwhla dwimalu (JD) Boys Hostel</h2>
            <p className="citk-hostel-location">📍 Inside Campus</p>
            <p>
              JD Boys Hostel ensures a safe and comfortable residential
              experience close to academic infrastructure.
            </p>
            <Link href="/facilities" className="citk-hostel-btn">View Hostel Details</Link>
          </div>
        </div>
      </section>

      <section className="citk-about-page" style={{ marginBottom: '40px' }}>
        <div className="citk-about-container">
          <div className="citk-about-intro">
            <h2 className="citk-about-title">About Us</h2>
            <p className="citk-about-description">
              Students of CIT – Central Institute of Technology, Kokrajhar face numerous challenges in hostel life. Unfortunately, many complaints remain unheard, unresolved, or even unnoticed by the wardens and authorities. <br /><br />
              To address this gap, we, the students of CIT, have developed a smart hostel management website. This platform allows students to report their issues easily without any manual paperwork or repeated follow-ups. Everything is handled digitally, saving time and effort for both students and hostel staff.<br /><br />
              The website also enables authorities to receive direct feedback from students, monitor issues in real time, and take quicker, more effective action. With additional hostel-related facilities and transparent communication, this initiative aims to create a more responsive, efficient, and student-friendly hostel environment. <br /><br />
              The <strong>CITK Hostel Management System</strong> is a centralized digital platform designed to enhance hostel life at the Central Institute of Technology Kokrajhar. It focuses on transparency, accountability, and student well-being by streamlining communication between hostel residents and administration.
            </p>
          </div>

          <div className="citk-about-stats">
            <div className="citk-stat-card">
              <i className="citk-stat-icon">🏠</i>
              <h3>Hostel Facilities</h3>
              <p>Efficient management of rooms, maintenance, and services</p>
            </div>
            <div className="citk-stat-card">
              <i className="citk-stat-icon">📢</i>
              <h3>Issue Reporting</h3>
              <p>Easy reporting and tracking of hostel-related problems</p>
            </div>
            <div className="citk-stat-card">
              <i className="citk-stat-icon">⏱️</i>
              <h3>Quick Resolution</h3>
              <p>Faster response through structured monitoring</p>
            </div>
            <div className="citk-stat-card">
              <i className="citk-stat-icon">🤝</i>
              <h3>Student–Admin Connect</h3>
              <p>Clear and transparent communication channels</p>
            </div>
          </div>

          <div className="citk-about-grid">
            <div className="citk-about-card">
              <h3>Our Vision</h3>
              <p>
                To create a safe, disciplined, and inclusive hostel environment where students feel secure, respected, and supported. We envision hostels that promote harmony, academic focus, and personal growth.
              </p>
            </div>
            <div className="citk-about-card">
              <h3>Our Goal</h3>
              <p>
                Our goal is to digitize hostel management processes by reducing manual work, ensuring transparency, and improving response time. This system aims to empower students while supporting efficient decision-making by hostel authorities.
              </p>
            </div>
          </div>

          <div className="citk-about-timeline">
            <h3 className="citk-timeline-title">Building a Meaningful Hostel Environment</h3>
            <div className="citk-timeline-item">
              <span className="citk-timeline-dot"></span>
              <p>
                <strong>Discipline & Responsibility:</strong> Encouraging students to follow hostel guidelines and respect shared spaces.
              </p>
            </div>
            <div className="citk-timeline-item">
              <span className="citk-timeline-dot"></span>
              <p>
                <strong>Cleanliness & Hygiene:</strong> Maintaining clean rooms, washrooms, and common areas for healthy living.
              </p>
            </div>
            <div className="citk-timeline-item">
              <span className="citk-timeline-dot"></span>
              <p>
                <strong>Safety & Security:</strong> Ensuring a secure hostel environment through proper monitoring and rules.
              </p>
            </div>
            <div className="citk-timeline-item">
              <span className="citk-timeline-dot"></span>
              <p>
                <strong>Respect & Cooperation:</strong> Promoting mutual respect among students, staff, and administration.
              </p>
            </div>
          </div>

          <div className="citk-about-future">
            <h3>Future Scope</h3>
            <p>
              In the future, this system can be extended to include room allocation, attendance tracking, mess management, notices, and emergency alerts. Our long-term aim is to make hostel life smarter, safer, and more student-friendly.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
