export const metadata = {
  title: 'CITK HOSTEL MANAGEMENT SYSTEM | Hostel Body',
}

export default function HostelBodyPage() {
  return (
    <>
      <section className="mess-menu-section">
        <h2 className="section-title" style={{ marginBottom: '20px' }}>SJ HOSTEL BODY</h2>

        <div className="download-box">
          <a href="/images/SJ HOSTEL BODY.pdf" download className="download-btn">
            <i className="fa-solid fa-download"></i> Download (PDF)
          </a>
        </div>

        <div className="table-wrapper">
          <table className="mess-menu-table hostel_body">
            <thead>
              <tr>
                <th>Designation</th>
                <th>Name</th>
                <th>Contact Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Chief Warden</td>
                <td>Dr. Shayaram Basumatary</td>
                <td>Mb: 8011131668 <br /><a href="mailto:chief.warden@cit.ac.in">chief.warden@cit.ac.in</a></td>
              </tr>
              <tr>
                <td>Warden</td>
                <td>Dr. Ranjan Patowary</td>
                <td>Mb: 9401920684 <br /><a href="mailto:warden.sj@cit.ac.in">warden.sj@cit.ac.in</a></td>
              </tr>
              <tr>
                <td>Warden</td>
                <td>Bikramjit Choudhury</td>
                <td>Mb: 8638005168 <br /><a href="mailto:chief.warden@cit.ac.in">chief.warden@cit.ac.in</a></td>
              </tr>
              <tr>
                <td>Prefect</td>
                <td>Pranabjyoti Chutia (202002062079)</td>
                <td>Mb: 7002919412 <br /> Room No: Warden Room</td>
              </tr>
              <tr>
                <td>Assistant Prefect (Sports)</td>
                <td>Pranjit Das (202202012064)</td>
                <td>Mb: 6000838751 <br />RoomNo: 212</td>
              </tr>
              <tr>
                <td>Assistant Prefect (Medical &amp; Internet)</td>
                <td>Nihit Baruah (202202021001)</td>
                <td>Mb: 8638562273 <br /> RoomNo: 303</td>
              </tr>
              <tr>
                <td>Assistant Prefect (Maintenance &amp; Stock)</td>
                <td>Suhail Raja (202202051039)</td>
                <td>Mb: 9957193416 <br />RoomNo: 207</td>
              </tr>
              <tr>
                <td>Mess Monitor</td>
                <td>Peter Basumatary (202202031018)</td>
                <td>Mb: 7637811645 <br />RoomNo: 210</td>
              </tr>
              <tr>
                <td>Mess Monitor</td>
                <td>Dipankar Sarania (202203081011)</td>
                <td>Mb: 6003568139 <br />Roomno: 134</td>
              </tr>
              <tr>
                <td>Caretaker</td>
                <td>Lakhinanda Daimary</td>
                <td>9859242295 <br /><a href="mailto:lakhinandadaimary@gmail.com">lakhinandadaimary@gmail.com</a></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mess-menu-section">
        <h2 className="section-title">BJ HOSTEL BODY</h2>
        <div className="table-wrapper">
          <table className="mess-menu-table hostel_body"></table>
        </div>
        <p className="empty-text">Not available.</p>
      </section>

      <section className="mess-menu-section">
        <h2 className="section-title">SNM HOSTEL BODY</h2>
        <div className="table-wrapper">
          <table className="mess-menu-table hostel_body"></table>
        </div>
        <p className="empty-text">Not available.</p>
      </section>

      <section className="mess-menu-section">
        <h2 className="section-title">JD HOSTEL BODY</h2>
        <div className="table-wrapper">
          <table className="mess-menu-table hostel_body"></table>
        </div>
        <p className="empty-text">Not available.</p>
      </section>

      <section className="mess-menu-section">
        <h2 className="section-title">Baokhungri HOSTEL BODY</h2>
        <div className="table-wrapper">
          <table className="mess-menu-table hostel_body"></table>
        </div>
        <p className="empty-text">Not available.</p>
      </section>

      <section className="mess-menu-section">
        <h2 className="section-title">Gambari HOSTEL BODY</h2>
        <div className="table-wrapper">
          <table className="mess-menu-table hostel_body"></table>
        </div>
        <p className="empty-text">Not available.</p>
      </section>

      <div className="menu-note hostel-body">
        <p>* Updated notices will be uploaded soon</p>
      </div>
    </>
  )
}
