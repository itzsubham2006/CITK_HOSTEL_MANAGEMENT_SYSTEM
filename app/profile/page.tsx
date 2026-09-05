'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [issues, setIssues] = useState<any[]>([])
  const [diaries, setDiaries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingPic, setUploadingPic] = useState(false)
  const [picFile, setPicFile] = useState<File | null>(null)
  const supabase = createClient()

  const loadData = async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)

      const { data: userIssues } = await supabase
        .from('complaints')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setIssues(userIssues || [])

      const { data: userDiaries } = await supabase
        .from('hostel_diaries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setDiaries(userDiaries || [])
    } catch (err) {
      console.error('Failed to load profile:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleUpdatePic = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!picFile || !profile || uploadingPic) return
    setUploadingPic(true)

    try {
      const fileExt = picFile.name.split('.').pop()
      const fileName = `${profile.id}_${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, picFile, { upsert: true })
      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath)

      await supabase.from('profiles').update({ profile_pic_url: publicUrlData.publicUrl }).eq('id', profile.id)
      loadData()
    } catch (err) {
      console.error('Pic upload error:', err)
      alert('Failed to update profile picture.')
    } finally {
      setUploadingPic(false)
    }
  }

  const handleDeleteDiary = async (id: number) => {
    if (!confirm('Delete this diary?')) return
    try {
      await supabase.from('hostel_diaries').delete().eq('id', id)
      setDiaries((prev) => prev.filter((d) => d.id !== id))
    } catch (err) {
      console.error('Delete diary error:', err)
    }
  }

  return (
    <div className="profile-wrapper" style={{ marginBottom: '50px' }}>
      {/* PROFILE HEADER */}
      <div className="profile-header">
        <div className="profile-pic">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={profile?.profile_pic_url || '/images/default_user.png'}
            alt="Profile Avatar"
            onError={(e) => {
              ;(e.target as HTMLImageElement).src = '/images/cit-logoo.png'
            }}
          />

          <form onSubmit={handleUpdatePic}>
            <input
              type="file"
              name="profile_pic"
              accept="image/*"
              required
              onChange={(e) => setPicFile(e.target.files?.[0] || null)}
            />
            <button type="submit" disabled={uploadingPic}>
              {uploadingPic ? 'Updating...' : 'Update Profile Picture'}
            </button>
          </form>
        </div>

        <div className="profile-info">
          <h2>Username: {profile?.username || 'Resident'}</h2>
          <p>Email: {profile?.email}</p>
          <p>Hostel: {profile?.hostel}</p>
          <p>Room No: {profile?.room_no}</p>
        </div>
      </div>

      {/* REPORTED ISSUES */}
      <h3 className="section-title">Your Reported Issues</h3>
      {issues.length === 0 ? (
        <p className="empty">No issues reported.</p>
      ) : (
        issues.map((issue) => (
          <div className="issue-card" key={issue.id}>
            <b>{issue.category}</b> — {issue.status}
            <p>{issue.description}</p>
          </div>
        ))
      )}

      {/* HOSTEL DIARIES */}
      <h3 className="section-title">Your Hostel Diaries</h3>
      <div className="diary-grid">
        {diaries.length === 0 ? (
          <p className="empty">No diaries yet.</p>
        ) : (
          diaries.map((diary) => (
            <div className="diary-card" key={diary.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={diary.image_url} alt="Hostel memory" />
              <p>{diary.caption}</p>

              <button
                type="button"
                className="delete-btn"
                onClick={() => handleDeleteDiary(diary.id)}
                style={{ background: '#ffeded', color: '#d93025', border: 'none', cursor: 'pointer', padding: '5px 10px', borderRadius: '4px' }}
              >
                🗑 Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
