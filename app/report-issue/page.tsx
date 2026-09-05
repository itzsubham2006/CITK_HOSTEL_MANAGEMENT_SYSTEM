'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ComplaintCategory, HostelName } from '@/types/database.types'

const categories: ComplaintCategory[] = [
  'Electricity',
  'Water',
  'Cleanliness',
  'Food',
  'Furniture',
  'Internet',
  'Security',
  'Bathroom',
  'Other',
]

const hostels: HostelName[] = ['SNM', 'SJ', 'JD', 'BJ', 'Bakhungri', 'Gambari']

export default function ReportIssuePage() {
  const router = useRouter()
  const [category, setCategory] = useState<ComplaintCategory>('Electricity')
  const [hostel, setHostel] = useState<HostelName>('SJ')
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
        if (data) {
          setUserProfile(data)
          if (data.hostel && hostels.includes(data.hostel)) {
            setHostel(data.hostel)
          }
        }
      }
    }
    loadUser()
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Image file size must be less than 10MB.')
        return
      }
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
      setError(null)
    } else {
      setImageFile(null)
      setImagePreview(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim() || loading) return
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('category', category)
      formData.append('description', description.trim())
      formData.append('hostel', hostel)
      if (imageFile) {
        formData.append('image', imageFile)
      }

      const res = await fetch('/api/complaints', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit issue')
      }

      router.push('/my-issues')
      router.refresh()
    } catch (err: unknown) {
      console.error('Submit issue error:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit issue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container margin-top" style={{ maxWidth: '600px', marginTop: '30px', marginBottom: '50px', marginLeft: 'auto', marginRight: 'auto', padding: '0 15px' }}>
      <div style={{ background: '#d3dcd0', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#2e7d32', marginBottom: '5px' }}>Report a Hostel Issue</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Select category and describe the problem clearly for quick resolution.
        </p>

        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #f87171',
              color: '#b91c1c',
              padding: '12px 16px',
              borderRadius: '6px',
              marginBottom: '15px',
              fontSize: '14px',
              lineHeight: '1.4',
            }}
          >
            <strong>Error:</strong> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Hostel</label>
            <select
              value={hostel}
              onChange={(e) => setHostel(e.target.value as HostelName)}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', background: 'white' }}
            >
              {hostels.map((h) => (
                <option key={h} value={h}>
                  {h} Hostel
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', background: 'white' }}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description of Issue</label>
            <textarea
              required
              rows={6}
              placeholder="Provide specific details, room number, or location of the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', height: '140px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Upload Image (optional)</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageChange}
              style={{ width: '100%' }}
            />
            <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>
              Upload photo if available (JPEG, PNG, WEBP, max 10MB)
            </small>

            {imagePreview && (
              <div style={{ marginTop: '10px', position: 'relative', display: 'inline-block' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ maxHeight: '150px', borderRadius: '6px', border: '1px solid #ccc' }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null)
                    setImagePreview(null)
                  }}
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    background: '#dc2626',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '22px',
                    height: '22px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Remove image"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? '#6b7280' : '#2e7d32',
              color: 'white',
              border: 'none',
              padding: '12px 25px',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i> Submitting Issue...
              </>
            ) : (
              'Submit Complaint'
            )}
          </button>
        </form>
      </div>

      <div className="info-panel" style={{ marginTop: '25px' }}>
        <h3>Note :</h3>
        <hr />
        <ul>
          <li>
            <i className="fa-solid fa-user"></i> A hostel is a shared responsibility and runs better when students care about it.
            <br />
            <br />
            Report genuine issues and be part of the solution.
          </li>
        </ul>
        <p className="info-note">Your reported issue can make a real difference.</p>
      </div>
    </div>
  )
}
