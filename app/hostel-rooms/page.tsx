'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { HostelName, UserRole } from '@/types/database.types'

const hostels: HostelName[] = ['SJ', 'JD', 'BJ', 'SNM', 'Bakhungri', 'Gambari']
const CAPACITY = 2

const floors = [
  { name: 'Ground Floor', start: 101, end: 142 },
  { name: '1st Floor', start: 201, end: 242 },
  { name: '2nd Floor', start: 301, end: 342 },
  { name: '3rd Floor', start: 401, end: 444 },
]

interface Profile {
  id: string
  username: string
  email: string
  role: UserRole
  hostel: HostelName | null
  room_no: string | null
  profile_pic_url?: string | null
}

function HostelRoomsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialHostelParam = searchParams.get('hostel') as HostelName | null

  const [selectedHostel, setSelectedHostel] = useState<HostelName>(
    initialHostelParam && hostels.includes(initialHostelParam) ? initialHostelParam : 'SJ'
  )
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null)

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [floorFilter, setFloorFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'empty' | 'occupied' | 'full'>('all')

  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push('/login?redirect=/hostel-rooms')
          return
        }

        const { data: prof, error: profError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        if (profError || !prof) {
          router.push('/login?redirect=/hostel-rooms')
          return
        }

        setUserProfile(prof as Profile)

        // STRICT ACCESS RESTRICTION: Only Warden and Admin
        if (prof.role !== 'admin' && prof.role !== 'warden') {
          setIsAuthorized(false)
          router.push('/student/dashboard')
          return
        }

        setIsAuthorized(true)

        // If no hostel param was specified, default to warden's assigned hostel if available
        if (!initialHostelParam && prof.hostel && hostels.includes(prof.hostel)) {
          setSelectedHostel(prof.hostel)
        }

        // Fetch all profiles to populate room occupancy
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, email, role, hostel, room_no, profile_pic_url')

        if (error) throw error
        setProfiles((data || []) as Profile[])
      } catch (err) {
        console.error('Failed to load room data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router, initialHostelParam, supabase])

  // Filter students for currently selected hostel
  const hostelStudents = useMemo(() => {
    return profiles.filter((p) => p.hostel === selectedHostel)
  }, [profiles, selectedHostel])

  // Map room_no -> array of students
  const roomMap = useMemo(() => {
    const map: Record<string, Profile[]> = {}
    hostelStudents.forEach((student) => {
      if (student.room_no && student.room_no !== 'None') {
        const r = String(student.room_no).trim()
        if (!map[r]) map[r] = []
        map[r].push(student)
      }
    })
    return map
  }, [hostelStudents])

  // Aggregate statistics for selected hostel
  const stats = useMemo(() => {
    let totalRooms = 0
    let occupiedRooms = 0
    let fullRooms = 0
    let partiallyOccupiedRooms = 0

    floors.forEach((fl) => {
      for (let r = fl.start; r <= fl.end; r++) {
        totalRooms++
        const count = roomMap[String(r)]?.length || 0
        if (count > 0) {
          occupiedRooms++
          if (count >= CAPACITY) {
            fullRooms++
          } else {
            partiallyOccupiedRooms++
          }
        }
      }
    })

    const vacantRooms = totalRooms - occupiedRooms
    const totalResidents = hostelStudents.filter((s) => s.room_no && s.room_no !== 'None').length
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0

    return {
      totalRooms,
      occupiedRooms,
      vacantRooms,
      fullRooms,
      partiallyOccupiedRooms,
      totalResidents,
      occupancyRate,
    }
  }, [roomMap, hostelStudents])

  // Filtered floors & rooms
  const displayedFloors = useMemo(() => {
    return floors
      .filter((fl) => (floorFilter === 'all' ? true : fl.name === floorFilter))
      .map((fl) => {
        const allFloorRooms = Array.from({ length: fl.end - fl.start + 1 }, (_, i) => fl.start + i)

        const filteredRooms = allFloorRooms.filter((roomNumber) => {
          const rStr = String(roomNumber)
          const students = roomMap[rStr] || []
          const count = students.length

          // Status filter
          if (statusFilter === 'empty' && count !== 0) return false
          if (statusFilter === 'occupied' && (count === 0 || count >= CAPACITY)) return false
          if (statusFilter === 'full' && count < CAPACITY) return false

          // Search query filter (room number or student name/email)
          if (searchQuery.trim()) {
            const query = searchQuery.trim().toLowerCase()
            const matchesRoom = rStr.includes(query)
            const matchesStudent = students.some(
              (s) =>
                s.username.toLowerCase().includes(query) ||
                s.email.toLowerCase().includes(query)
            )
            if (!matchesRoom && !matchesStudent) return false
          }

          return true
        })

        return {
          ...fl,
          rooms: filteredRooms,
          totalFloorRooms: allFloorRooms.length,
          occupiedFloorRooms: allFloorRooms.filter((r) => (roomMap[String(r)]?.length || 0) > 0).length,
        }
      })
  }, [floorFilter, statusFilter, searchQuery, roomMap])

  // Occupants of currently selected room modal
  const currentRoomStudents = selectedRoom ? roomMap[String(selectedRoom)] || [] : []

  // Guard: Unauthorized view while redirecting
  if (isAuthorized === false) {
    return (
      <div style={{ maxWidth: '600px', margin: '80px auto', textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: '48px', color: '#d32f2f', marginBottom: '16px' }}>
          <i className="fa-solid fa-lock"></i>
        </div>
        <h2 style={{ color: '#333', marginBottom: '10px' }}>Access Restricted</h2>
        <p style={{ color: '#666', lineHeight: '1.5', marginBottom: '25px' }}>
          The Hostel Room Layout is reserved strictly for Wardens and Administrators. Redirecting to your dashboard...
        </p>
        <Link
          href="/student/dashboard"
          style={{
            display: 'inline-block',
            padding: '10px 24px',
            background: '#2e7d32',
            color: '#fff',
            borderRadius: '6px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Go to Student Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 20px', minHeight: '80vh' }}>
      {/* Top Breadcrumb & Header Banner */}
      <div
        style={{
          background: '#d7e6d0',
          padding: '24px',
          borderRadius: '12px',
          marginBottom: '25px',
          borderLeft: '6px solid #2e7d32',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '15px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Link
              href={userProfile?.role === 'admin' ? '/admin/dashboard' : '/warden/dashboard'}
              style={{ color: '#2e7d32', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}
            >
              ← Back to {userProfile?.role === 'admin' ? 'Admin' : 'Warden'} Dashboard
            </Link>
            <span style={{ color: '#888' }}>•</span>
            <span
              style={{
                fontSize: '11px',
                background: '#2e7d32',
                color: '#fff',
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Staff Only
            </span>
          </div>
          <h1 style={{ color: '#1b5e20', fontSize: '26px', margin: 0, fontWeight: 700 }}>
            🏨 Hostel Room Occupancy &amp; Allocation
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#444', fontSize: '14px' }}>
            Monitor real-time room occupancies, student allocations, and room vacancies across CIT Kokrajhar hostels.
          </p>
        </div>

        <div>
          <span
            style={{
              display: 'inline-block',
              background: '#fff',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#333',
              boxShadow: '0 2px 5px rgba(0,0,0,0.06)',
            }}
          >
            <i className="fa-solid fa-user-shield" style={{ color: '#2e7d32', marginRight: '6px' }}></i>
            {userProfile?.username || 'Staff'} ({userProfile?.role})
          </span>
        </div>
      </div>

      {/* Hostel Selection Tabs */}
      <div style={{ marginBottom: '25px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#555', marginBottom: '10px' }}>
          SELECT HOSTEL TO INSPECT:
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {hostels.map((h) => {
            const isActive = selectedHostel === h
            return (
              <button
                key={h}
                type="button"
                onClick={() => setSelectedHostel(h)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: isActive ? '2px solid #2e7d32' : '1px solid #dcdcdc',
                  background: isActive ? '#2e7d32' : '#ffffff',
                  color: isActive ? '#ffffff' : '#333333',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: isActive ? '0 4px 10px rgba(46,125,50,0.25)' : '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.15s ease',
                }}
              >
                <i className="fa-solid fa-building" style={{ fontSize: '13px' }}></i>
                {h} Hostel
              </button>
            )
          })}
        </div>
      </div>

      {/* Overview Statistics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '25px',
        }}
      >
        <div
          style={{
            background: '#ffffff',
            padding: '18px 20px',
            borderRadius: '10px',
            border: '1px solid #e0e0e0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ fontSize: '12px', color: '#666', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Rooms
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1b5e20', margin: '4px 0' }}>
            {stats.totalRooms}
          </div>
          <div style={{ fontSize: '12px', color: '#888' }}>4 Floors (101 to 444)</div>
        </div>

        <div
          style={{
            background: '#ffffff',
            padding: '18px 20px',
            borderRadius: '10px',
            border: '1px solid #e0e0e0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ fontSize: '12px', color: '#666', fontWeight: 600, textTransform: 'uppercase' }}>
            Assigned Residents
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2c5aa0', margin: '4px 0' }}>
            {stats.totalResidents}
          </div>
          <div style={{ fontSize: '12px', color: '#888' }}>Registered in {selectedHostel}</div>
        </div>

        <div
          style={{
            background: '#ffffff',
            padding: '18px 20px',
            borderRadius: '10px',
            border: '1px solid #e0e0e0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ fontSize: '12px', color: '#666', fontWeight: 600, textTransform: 'uppercase' }}>
            Vacant Rooms
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2e7d32', margin: '4px 0' }}>
            {stats.vacantRooms}
          </div>
          <div style={{ fontSize: '12px', color: '#2e7d32', fontWeight: 500 }}>Ready for Allocation</div>
        </div>

        <div
          style={{
            background: '#ffffff',
            padding: '18px 20px',
            borderRadius: '10px',
            border: '1px solid #e0e0e0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ fontSize: '12px', color: '#666', fontWeight: 600, textTransform: 'uppercase' }}>
            Occupancy Rate
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#b78103', margin: '4px 0' }}>
            {stats.occupancyRate}%
          </div>
          <div
            style={{
              width: '100%',
              height: '6px',
              background: '#eee',
              borderRadius: '3px',
              overflow: 'hidden',
              marginTop: '4px',
            }}
          >
            <div
              style={{
                width: `${stats.occupancyRate}%`,
                height: '100%',
                background: '#b78103',
                borderRadius: '3px',
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Interactive Controls, Search, and Color Legend */}
      <div
        style={{
          background: '#ffffff',
          padding: '20px',
          borderRadius: '10px',
          border: '1px solid #e0e0e0',
          marginBottom: '25px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '15px',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Search box */}
          <div style={{ flex: '1 1 250px' }}>
            <div style={{ position: 'relative' }}>
              <i
                className="fa-solid fa-magnifying-glass"
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#888',
                  fontSize: '13px',
                }}
              ></i>
              <input
                type="text"
                placeholder="Search by room (e.g. 204) or student name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 34px',
                  fontSize: '13px',
                  border: '1px solid #ccc',
                  borderRadius: '6px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Floor filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#555' }}>Floor:</label>
            <select
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #ccc',
                fontSize: '13px',
                background: '#fff',
              }}
            >
              <option value="all">All Floors</option>
              {floors.map((fl) => (
                <option key={fl.name} value={fl.name}>
                  {fl.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#555' }}>Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #ccc',
                fontSize: '13px',
                background: '#fff',
              }}
            >
              <option value="all">All Statuses</option>
              <option value="empty">Vacant (0/2)</option>
              <option value="occupied">Partially Occupied (1/2)</option>
              <option value="full">Full (2/2)</option>
            </select>
          </div>
        </div>

        {/* Legend */}
        <div
          style={{
            marginTop: '16px',
            paddingTop: '14px',
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap',
            fontSize: '12px',
          }}
        >
          <span style={{ fontWeight: 600, color: '#666' }}>Legend:</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '3px',
                background: '#e8f5e9',
                border: '1px solid #a5d6a7',
                display: 'inline-block',
              }}
            ></span>
            <strong style={{ color: '#2e7d32' }}>Vacant (0/{CAPACITY})</strong>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '3px',
                background: '#fff8e1',
                border: '1px solid #ffe082',
                display: 'inline-block',
              }}
            ></span>
            <strong style={{ color: '#b78103' }}>Partially Occupied (1/{CAPACITY})</strong>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '3px',
                background: '#ffebee',
                border: '1px solid #ffcdd2',
                display: 'inline-block',
              }}
            ></span>
            <strong style={{ color: '#c62828' }}>Full ({CAPACITY}/{CAPACITY})</strong>
          </span>
        </div>
      </div>

      {/* Room Layout per Floor */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#666', background: '#fff', borderRadius: '10px' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '28px', color: '#2e7d32', marginBottom: '12px' }}></i>
          <p>Loading {selectedHostel} room allocation map...</p>
        </div>
      ) : displayedFloors.length === 0 || displayedFloors.every((f) => f.rooms.length === 0) ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#666', background: '#fff', borderRadius: '10px' }}>
          <i className="fa-solid fa-building-circle-xmark" style={{ fontSize: '32px', color: '#888', marginBottom: '10px' }}></i>
          <p>No rooms match your filter criteria.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          {displayedFloors.map((fl) => {
            if (fl.rooms.length === 0) return null

            return (
              <div
                key={fl.name}
                style={{
                  background: '#ffffff',
                  borderRadius: '10px',
                  border: '1px solid #e0e0e0',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  overflow: 'hidden',
                }}
              >
                {/* Floor Header Bar */}
                <div
                  style={{
                    background: '#f9fbf8',
                    padding: '14px 20px',
                    borderBottom: '1px solid #eaeaea',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: '#2e7d32',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                      }}
                    >
                      <i className="fa-solid fa-layer-group"></i>
                    </div>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#1b5e20' }}>
                      {fl.name}
                    </span>
                    <span style={{ fontSize: '13px', color: '#777' }}>
                      (Rooms {fl.start} – {fl.end})
                    </span>
                  </div>

                  <div style={{ fontSize: '13px', color: '#555', fontWeight: 600 }}>
                    {fl.occupiedFloorRooms} / {fl.totalFloorRooms} Rooms Occupied
                  </div>
                </div>

                {/* Rooms Grid */}
                <div
                  style={{
                    padding: '20px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))',
                    gap: '10px',
                  }}
                >
                  {fl.rooms.map((roomNumber) => {
                    const rStr = String(roomNumber)
                    const occupants = roomMap[rStr] || []
                    const count = occupants.length

                    let bg = '#e8f5e9'
                    let border = '#c8e6c9'
                    let textColor = '#1b5e20'
                    let badgeColor = '#2e7d32'

                    if (count >= CAPACITY) {
                      bg = '#ffebee'
                      border = '#ffcdd2'
                      textColor = '#c62828'
                      badgeColor = '#c62828'
                    } else if (count > 0) {
                      bg = '#fff8e1'
                      border = '#ffe082'
                      textColor = '#b78103'
                      badgeColor = '#b78103'
                    }

                    const isMatchesSearch =
                      searchQuery.trim() &&
                      (rStr.includes(searchQuery.trim().toLowerCase()) ||
                        occupants.some((s) =>
                          s.username.toLowerCase().includes(searchQuery.trim().toLowerCase())
                        ))

                    return (
                      <button
                        key={roomNumber}
                        type="button"
                        onClick={() => setSelectedRoom(roomNumber)}
                        title={
                          occupants.length > 0
                            ? `Room ${roomNumber}: ${occupants.map((o) => o.username).join(', ')}`
                            : `Room ${roomNumber}: Vacant`
                        }
                        style={{
                          background: bg,
                          border: isMatchesSearch ? '2px solid #2c5aa0' : `1px solid ${border}`,
                          borderRadius: '8px',
                          padding: '10px 4px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                          boxShadow: isMatchesSearch ? '0 0 0 2px rgba(44,90,160,0.3)' : 'none',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)'
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = isMatchesSearch
                            ? '0 0 0 2px rgba(44,90,160,0.3)'
                            : 'none'
                        }}
                      >
                        <span style={{ fontSize: '14px', fontWeight: 700, color: textColor }}>
                          {roomNumber}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            color: badgeColor,
                            background: 'rgba(255,255,255,0.7)',
                            padding: '1px 5px',
                            borderRadius: '4px',
                          }}
                        >
                          {count}/{CAPACITY}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Room Details Modal */}
      {selectedRoom !== null && (
        <div
          onClick={() => setSelectedRoom(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              maxWidth: '460px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
              position: 'relative',
              border: '1px solid #eaeaea',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '16px',
                borderBottom: '1px solid #eee',
                paddingBottom: '14px',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#2e7d32',
                    letterSpacing: '0.5px',
                  }}
                >
                  {selectedHostel} Hostel
                </span>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', color: '#1b5e20', fontWeight: 700 }}>
                  Room {selectedRoom} Details
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRoom(null)}
                style={{
                  background: '#f0f0f0',
                  border: 'none',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: '#666',
                }}
              >
                ×
              </button>
            </div>

            {/* Occupancy Status Badge */}
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#666' }}>Current Allocation:</span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '12px',
                  background:
                    currentRoomStudents.length === 0
                      ? '#e8f5e9'
                      : currentRoomStudents.length >= CAPACITY
                      ? '#ffebee'
                      : '#fff8e1',
                  color:
                    currentRoomStudents.length === 0
                      ? '#2e7d32'
                      : currentRoomStudents.length >= CAPACITY
                      ? '#c62828'
                      : '#b78103',
                }}
              >
                {currentRoomStudents.length === 0
                  ? 'Vacant (0/2)'
                  : currentRoomStudents.length >= CAPACITY
                  ? 'Fully Occupied (2/2)'
                  : 'Partially Occupied (1/2)'}
              </span>
            </div>

            {/* Students List */}
            <div style={{ margin: '16px 0' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#777', textTransform: 'uppercase', marginBottom: '8px' }}>
                Assigned Occupants ({currentRoomStudents.length} / {CAPACITY})
              </div>

              {currentRoomStudents.length === 0 ? (
                <div
                  style={{
                    padding: '24px 16px',
                    textAlign: 'center',
                    background: '#f9f9f9',
                    borderRadius: '8px',
                    border: '1px dashed #ddd',
                    color: '#888',
                    fontSize: '13px',
                  }}
                >
                  <i className="fa-regular fa-circle-check" style={{ fontSize: '24px', color: '#2e7d32', marginBottom: '8px', display: 'block' }}></i>
                  No residents currently assigned to this room.
                  <br />
                  <span style={{ fontSize: '12px', color: '#999' }}>Available for student allocation.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {currentRoomStudents.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        padding: '12px 14px',
                        background: '#f9fbf8',
                        border: '1px solid #e2ece1',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: '#2e7d32',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '14px',
                          }}
                        >
                          {s.username ? s.username[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#333', fontSize: '14px' }}>
                            {s.username}
                          </div>
                          <a
                            href={`mailto:${s.email}`}
                            style={{ fontSize: '12px', color: '#2c5aa0', textDecoration: 'none' }}
                          >
                            {s.email}
                          </a>
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: '11px',
                          background: '#e0e0e0',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          textTransform: 'capitalize',
                          color: '#555',
                          fontWeight: 600,
                        }}
                      >
                        {s.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSelectedRoom(null)}
                style={{
                  padding: '8px 20px',
                  background: '#2e7d32',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function HostelRoomsPage() {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '28px', color: '#2e7d32', marginBottom: '12px' }}></i>
          <p>Loading hostel room management portal...</p>
        </div>
      }
    >
      <HostelRoomsContent />
    </Suspense>
  )
}

