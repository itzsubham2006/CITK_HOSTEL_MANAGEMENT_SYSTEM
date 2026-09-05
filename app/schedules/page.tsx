export const metadata = {
  title: 'CITK HOSTEL MANAGEMENT SYSTEM | Schedule',
}

export default function SchedulesPage() {
  return (
    <>
      <h2 style={{ textAlign: 'center', fontSize: '28px', color: '#2e7d32', margin: '20px' }}>
        CIT Hostel Management Portal
      </h2>

      <section className="mess-menu-section">
        <h2 className="section-title" style={{ marginBottom: '20px', fontSize: '20px' }}>
          Weekly Hostel Mess Menu
        </h2>

        <div className="download-box">
          <a href="/images/mess_menu.pdf" download className="download-btn">
            <i className="fa-solid fa-download"></i> Download Menu (PDF)
          </a>
        </div>

        <div className="table-wrapper">
          <table className="mess-menu-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Breakfast</th>
                <th>Lunch</th>
                <th>Dinner</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Monday</td>
                <td>Bread Butter/Jam<br />Milk Tea/Coffee</td>
                <td>Rice, Daal, Mix Veg Curry, Veg Fry, Salad, Papad</td>
                <td>Rice/Roti, Daal, Mix Veg Curry, Veg Fry, Salad, Papad</td>
              </tr>
              <tr>
                <td>Tuesday</td>
                <td>Poori Sabji<br />Milk Tea/Coffee</td>
                <td>Rice, Daal, Mix Veg Curry, Veg Fry, Salad, Papad</td>
                <td>Rice/Roti, Daal, Mix Veg Curry, Veg Fry, Salad, Papad</td>
              </tr>
              <tr>
                <td>Wednesday</td>
                <td>Noodles<br />Milk Tea/Coffee</td>
                <td>Rice, Daal, Mix Veg Curry, Veg Fry, Salad, Papad</td>
                <td>Rice/Roti, Daal, Mix Veg Curry, Veg Fry, Salad, Papad</td>
              </tr>
              <tr>
                <td>Thursday</td>
                <td>Poori Sabji<br />Milk Tea/Coffee</td>
                <td>Rice, Daal, Mix Veg Curry, Veg Fry, Salad, Papad</td>
                <td>Rice/Roti, Daal, Mix Veg Curry, Veg Fry, Salad, Papad</td>
              </tr>
              <tr>
                <td>Friday</td>
                <td>Bread Butter/Jam<br />Milk Tea/Coffee</td>
                <td>Rice, Daal, Mix Veg Curry, Veg Fry, Salad, Papad</td>
                <td>Rice/Roti, Daal, Mix Veg Curry, Veg Fry, Salad, Papad</td>
              </tr>
              <tr>
                <td>Saturday</td>
                <td>Poori Sabji<br />Milk Tea/Coffee</td>
                <td>Rice, Daal, Mix Veg Curry, Veg Fry, Salad, Papad</td>
                <td>Rice/Roti, Daal, Mix Veg Curry, Veg Fry, Salad, Papad</td>
              </tr>
              <tr>
                <td>Sunday</td>
                <td>Noodles<br />Milk Tea/Coffee</td>
                <td>Rice, Daal, Mix Veg Curry, Veg Fry, Salad, Papad</td>
                <td>Rice/Roti, Daal, Mix Veg Curry, Veg Fry, Salad, Papad</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="menu-note">
          <p style={{ marginTop: '10px' }}>* Only local rice (Ranjid) will be served.</p>
          <p>* Rice/Roti/Daal/Veg Curry served in unlimited quantity.</p>
          <p>* Mustard oil of approved brands will be used.</p>
          <p style={{ color: '#2e7d32', fontSize: '18px', fontWeight: 300 }}>
            * This routine might changed, updated routine will be uploaded soon
          </p>
        </div>
      </section>

      <section className="gen-menu-section">
        <h2 className="section-title" style={{ marginBottom: '20px' }}>
          Time Schedule for Operation of Generator
        </h2>

        <div className="download-box">
          <a href="/images/gen_sched.jpeg" download className="download-btn">
            <i className="fa-solid fa-download"></i> Download(PDF)
          </a>
        </div>

        <div className="table-wrapper">
          <table className="mess-menu-table">
            <thead>
              <tr>
                <th>Quarter and Guest House</th>
                <th>Hostels</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>6 AM to 7 AM</td>
                <td>7 AM to 8:30 AM</td>
              </tr>
              <tr>
                <td>10:30 AM to 11:30 AM</td>
                <td>12:00 AM to 1:00 PM</td>
              </tr>
              <tr>
                <td>1:30 PM to 2:30 PM</td>
                <td></td>
              </tr>
              <tr>
                <td>3 PM to 4 PM</td>
                <td>4:30 PM to 5:30 PM</td>
              </tr>
              <tr>
                <td>6:30 PM to 1 AM</td>
                <td>6:30 PM to 3 AM</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="menu-note">
          <p style={{ color: '#2e7d32', fontSize: '18px', fontWeight: 300 }}>
            * This routine might changed, updated routine will be uploaded soon
          </p>
        </div>
      </section>
    </>
  )
}
