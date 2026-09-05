import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { message } = await req.json()
    const query = (message || '').toLowerCase()

    let reply = "I am the CITK Hostel Assistant. You can ask me about mess timings, wardens, ragging policies, room allocation, generator schedules, or reporting complaints!"

    if (query.includes('warden') || query.includes('contact')) {
      reply = "Chief Warden is Dr. Shayaram Basumatary (8011131668). Sujit Narzary (SNM) wardens are Dr. Shafi Kamal Rahman (9957000980) and Mr. Jackie Brahma (7086261226). Basiram Jhwlao (BJ) warden is Dr. Apurba Kr. Raibaruah (9365760309)."
    } else if (query.includes('mess') || query.includes('food') || query.includes('lunch') || query.includes('dinner') || query.includes('breakfast')) {
      reply = "Breakfast is served with tea/coffee & items like poori sabji or bread butter. Lunch & Dinner include unlimited rice, daal, mix veg curry, veg fry, salad & papad. Check the Schedules page for full details."
    } else if (query.includes('ragging')) {
      reply = "CIT Kokrajhar maintains a strict zero-tolerance policy against ragging. You can call the 24x7 toll-free helpline 1800-180-5522 or submit a grievance directly on our Anti-Ragging page."
    } else if (query.includes('generator') || query.includes('electricity') || query.includes('power')) {
      reply = "Hostel generator timing is 7:00 AM – 8:30 AM, 12:00 PM – 1:00 PM, 4:30 PM – 5:30 PM, and 6:30 PM – 3:00 AM."
    } else if (query.includes('wifi') || query.includes('internet') || query.includes('lan')) {
      reply = "CIT Kokrajhar provides free high-speed Ethernet and Wi-Fi internet connectivity across all campus hostels."
    } else if (query.includes('complaint') || query.includes('issue') || query.includes('report') || query.includes('problem')) {
      reply = "You can report issues like electricity, plumbing, cleanliness, mess, or internet via the 'Report Issue' page. You can track status under 'My Issues'."
    } else if (query.includes('hostel') || query.includes('room')) {
      reply = "CIT Kokrajhar manages 5+ boys hostels (SNM, SJ, JD, BJ, APJ) and 4+ girls hostels (Gambari Sikwla, Baokhungri, Nijwm, Manisha) accommodating 500+ students."
    } else if (query.includes('hello') || query.includes('hi') || query.includes('hey')) {
      reply = "Hello! How can I assist you with CIT Kokrajhar hostel services today?"
    }

    return NextResponse.json({ reply })
  } catch {
    return NextResponse.json({ reply: "⚠️ Error processing request. Please try again." }, { status: 500 })
  }
}
