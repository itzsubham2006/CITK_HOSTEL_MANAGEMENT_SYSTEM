'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { HostelName } from '@/types/database.types'

const hostels: HostelName[] = ['SJ', 'JD', 'BJ', 'SNM', 'Bakhungri', 'Gambari']
const CAPACITY = 2

const floors = [
  { name: 'Ground Floor', start: 101, end: 142 },
  { name: '1st Floor', start: 201, end: 242 },
  { name: '2nd Floor', start: 301, end: 342 },
  { name: '3rd Floor', start: 401, end: 444 },
]

export default function HostelRoomsPage() {
  const [selectedHostel, setSelectedHostel] = useState<HostelName>('SJ')
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
          setUserProfile(prof)
          if (prof?.hostel) {
            setSelectedHostel(prof.hostel)
          }
        }

        const { data, error } = await supabase.from('profiles').select('*')
        if (error) throw error
        setProfiles(data || [])
      } catch (err) {
        console.error('Failed to load room data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const hostelStudents = profiles.filter((p) => p.hostel === selectedHostel)

  // Map room_no to array of students
  const roomMap: Record<string, any[]> = {}
  hostelStudents.forEach((student) => {
    const r = String(student.room_no)
    if (!roomMap[r]) roomMap[r] = []
    roomMap[r].push(student)
  })

  const isStaff = userProfile?.role === 'admin' || userProfile?.role === 'warden'

  const currentRoomStudents = selectedRoom ? roomMap[String(selectedRoom)] || [] : []

  return (
    <div>
      <form className="hostel-switch" onSubmit={(e) => e.preventDefault()}>
        <label>Select Hostel:</label>
        <select
          value={selectedHostel}
          onChange={(e) => setSelectedHostel(e.target.value as HostelName)}
        >
          {hostels.map((h) => (
            <option key={h} value={h}>
              {h} Hostel
            </option>
          ))}
        </select>
      </form>

      <section className="hostel-map-section">
        <h2 className="section-title">🏠 {selectedHostel} – Room Layout</h2>

        {loading ? (
          <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>Loading room layout...</p>
        ) : (
          <div className="floors-container">
            {floors.map((fl) => (
              <div className="floor" key={fl.name}>
                <div className="floor-title">{fl.name}</div>

                <div className="rooms">
                  {Array.from({ length: fl.end - fl.start + 1 }, (_, i) => fl.start + i).map((room) => {
                    const r = String(room)
                    const count = roomMap[r]?.length || 0
                    const statusClass = count === 0 ? 'empty' : count < CAPACITY ? 'occupied' : 'full'

                    return (
                      <div
                        key={room}
                        className={`room ${statusClass}`}
                        data-room={room}
                        onClick={() => setSelectedRoom(room)}
                        style={{ cursor: 'pointer' }}
                      >
                        {room}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Room Modal */}
      {selectedRoom !== null && (
        <div className="room-modal" id="roomModal" style={{ display: 'flex' }} onClick={() => setSelectedRoom(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="close-btn" id="closeModal" onClick={() => setSelectedRoom(null)}>
              ×
            </span>
            <h3 id="modalRoomTitle">Room {selectedRoom}</h3>

            <div id="modalContent" style={{ marginTop: '15px' }}>
              {currentRoomStudents.length === 0 ? (
                <p style={{ color: '#888', fontStyle: 'italic' }}>No students currently assigned to this room.</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {currentRoomStudents.map((s) => (
                    <li
                      key={s.id}
                      style={{
                        padding: '10px',
                        borderBottom: '1px solid #eee',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      <i className="fa-solid fa-user" style={{ color: '#2e7d32' }}></i>
                      <div>
                        <strong>{s.username}</strong>
                        <small style={{ display: 'block', color: '#666' }}>{s.email}</small>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div style={{ marginTop: '15px', fontSize: '13px', color: '#666' }}>
              Capacity: {currentRoomStudents.length} / {CAPACITY} occupants
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
