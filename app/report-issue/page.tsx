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

export default function ReportIssuePage() {
  const router = useRouter()
  const [category, setCategory] = useState<ComplaintCategory>('Electricity')
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
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
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setUserProfile(data)
      }
    }
    loadUser()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim() || loading) return
    setLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      let imageUrl: string | null = null

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('complaint-images')
          .upload(filePath, imageFile)

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('complaint-images')
            .getPublicUrl(filePath)
          imageUrl = publicUrlData.publicUrl
        }
      }

      const { error: insertError } = await supabase.from('complaints').insert({
        user_id: user.id,
        hostel: userProfile?.hostel || 'SJ',
        category,
        description,
        image_url: imageUrl,
        status: 'Pending',
        upvotes: 1,
      })

      if (insertError) throw insertError

      router.push('/my-issues')
      router.refresh()
    } catch (err: unknown) {
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
          Hostel: <strong>{userProfile?.hostel || 'SJ'}</strong>
        </p>

        {error && <p style={{ color: '#d32f2f', marginBottom: '10px' }}>{error}</p>}

        <form onSubmit={handleSubmit}>
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', height: '150px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Upload Image (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              style={{ width: '100%' }}
            />
            <small style={{ color: '#777' }}>Upload image if available, only (jpg, png)</small>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: '#2e7d32',
              color: 'white',
              border: 'none',
              padding: '12px 25px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            {loading ? 'Submitting...' : 'Submit Complaint'}
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
