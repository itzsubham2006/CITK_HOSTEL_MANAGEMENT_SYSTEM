'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function HostelDiariesPage() {
  const [diaries, setDiaries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  // Upload Form state
  const [caption, setCaption] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  // Comment inputs map
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({})

  const supabase = createClient()

  const loadDiaries = async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setUserProfile(prof)
      }

      const { data, error } = await supabase
        .from('hostel_diaries')
        .select(`
          *,
          profiles(username, hostel),
          diary_likes(user_id),
          diary_comments(id, user_id, comment, created_at, profiles(username))
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDiaries(data || [])
    } catch (err) {
      console.error('Failed to load diaries:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDiaries()
  }, [])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageFile || !caption.trim() || uploading || !userProfile) return
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('image', imageFile)
      formData.append('caption', caption.trim())

      const res = await fetch('/api/diaries/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Failed to upload photo.')
      }

      setCaption('')
      setImageFile(null)
      // Reset file input value
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      if (fileInput) fileInput.value = ''

      loadDiaries()
    } catch (err: unknown) {
      console.error('Upload error:', err)
      alert(err instanceof Error ? err.message : 'Failed to upload photo.')
    } finally {
      setUploading(false)
    }
  }

  const handleToggleLike = async (diaryId: number) => {
    if (!userProfile) return

    const diary = diaries.find((d) => d.id === diaryId)
    const hasLiked = diary?.diary_likes?.some((l: any) => l.user_id === userProfile.id)

    try {
      if (hasLiked) {
        await supabase.from('diary_likes').delete().eq('user_id', userProfile.id).eq('diary_id', diaryId)
        setDiaries((prev) =>
          prev.map((d) =>
            d.id === diaryId
              ? { ...d, diary_likes: d.diary_likes.filter((l: any) => l.user_id !== userProfile.id) }
              : d
          )
        )
      } else {
        await supabase.from('diary_likes').insert({
          user_id: userProfile.id,
          diary_id: diaryId,
        })
        setDiaries((prev) =>
          prev.map((d) =>
            d.id === diaryId
              ? { ...d, diary_likes: [...(d.diary_likes || []), { user_id: userProfile.id }] }
              : d
          )
        )
      }
    } catch (err) {
      console.error('Like toggle error:', err)
    }
  }

  const handleAddComment = async (diaryId: number, e: React.FormEvent) => {
    e.preventDefault()
    const text = commentInputs[diaryId]?.trim()
    if (!text || !userProfile) return

    try {
      const { data, error } = await supabase
        .from('diary_comments')
        .insert({
          user_id: userProfile.id,
          diary_id: diaryId,
          comment: text,
        })
        .select('id, user_id, comment, created_at, profiles(username)')
        .single()

      if (error) throw error

      setCommentInputs((prev) => ({ ...prev, [diaryId]: '' }))
      setDiaries((prev) =>
        prev.map((d) =>
          d.id === diaryId
            ? { ...d, diary_comments: [...(d.diary_comments || []), data] }
            : d
        )
      )
    } catch (err) {
      console.error('Comment error:', err)
    }
  }

  return (
    <div className="diary-page">
      <h2 className="page-title">Hostel Diaries</h2>

      {/* Upload Box */}
      <div className="upload-box">
        <form onSubmit={handleUpload}>
          <input
            type="file"
            name="image"
            accept="image/*"
            required
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          />
          <input
            type="text"
            name="caption"
            placeholder="Share your hostel memory..."
            required
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          <button type="submit" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </form>
      </div>

      {/* Diary Grid */}
      {loading ? (
        <p style={{ textAlign: 'center', marginTop: '30px', color: '#666' }}>Loading memories...</p>
      ) : diaries.length === 0 ? (
        <p style={{ textAlign: 'center', marginTop: '30px', color: '#666' }}>No hostel memories uploaded yet. Be the first!</p>
      ) : (
        <div className="diary-grid">
          {diaries.map((diary) => {
            const likesCount = diary.diary_likes?.length || 0
            const comments = diary.diary_comments || []

            return (
              <div className="diary-card" key={diary.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={diary.image_url}
                  alt="Hostel Memory"
                  className="diary-image"
                  onClick={() => setSelectedImage(diary.image_url)}
                  style={{ cursor: 'pointer' }}
                />

                <p className="caption">{diary.caption}</p>

                <small className="user">— {diary.profiles?.username || 'Resident'}</small>

                <button
                  type="button"
                  className="like-btn"
                  onClick={() => handleToggleLike(diary.id)}
                >
                  ❤️ <span id={`like-count-${diary.id}`}>{likesCount}</span>
                </button>

                <div className="comments">
                  {comments.length === 0 ? (
                    <p className="no-comment">No comments yet</p>
                  ) : (
                    comments.map((c: any) => (
                      <p key={c.id}>
                        <b>{c.profiles?.username || 'Resident'}</b> : {c.comment}
                      </p>
                    ))
                  )}
                </div>

                <form onSubmit={(e) => handleAddComment(diary.id, e)} className="comment-form">
                  <input
                    type="text"
                    name="comment"
                    placeholder="Write a comment..."
                    required
                    value={commentInputs[diary.id] || ''}
                    onChange={(e) =>
                      setCommentInputs({ ...commentInputs, [diary.id]: e.target.value })
                    }
                  />
                  <button type="submit">Post</button>
                </form>
              </div>
            )
          })}
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div
          id="imageModal"
          className="image-modal"
          style={{ display: 'block' }}
          onClick={() => setSelectedImage(null)}
        >
          <span className="close" onClick={() => setSelectedImage(null)}>
            &times;
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="modal-content" src={selectedImage} alt="Expanded memory" />
        </div>
      )}
    </div>
  )
}
