'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, MessageCircle, Trash2, Send } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { HostelName, UserRole } from '@/types/database.types'

interface DiaryComment {
  id: number
  user_id: string
  comment: string
  created_at: string
  profiles?: { username: string }
}

interface DiaryCardProps {
  diary: {
    id: number
    user_id: string
    image_url: string
    caption: string | null
    created_at: string
    profiles?: {
      username: string
      hostel: HostelName
      profile_pic_url: string | null
    }
    diary_likes?: { user_id: string }[]
    diary_comments?: DiaryComment[]
  }
  currentUserId?: string
  currentUserRole?: UserRole
}

export default function DiaryCard({
  diary,
  currentUserId,
  currentUserRole = 'student',
}: DiaryCardProps) {
  const router = useRouter()
  const [likesCount, setLikesCount] = useState(diary.diary_likes?.length || 0)
  const [hasLiked, setHasLiked] = useState(
    diary.diary_likes?.some((l) => l.user_id === currentUserId) || false
  )
  const [comments, setComments] = useState<DiaryComment[]>(diary.diary_comments || [])
  const [newComment, setNewComment] = useState('')
  const [showComments, setShowComments] = useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const supabase = createClient()
  const isAuthor = currentUserId === diary.user_id
  const isAdminOrWarden = currentUserRole === 'admin' || currentUserRole === 'warden'
  const canDelete = isAuthor || isAdminOrWarden

  const handleToggleLike = async () => {
    if (!currentUserId) return
    const nextHasLiked = !hasLiked
    const nextCount = nextHasLiked ? likesCount + 1 : Math.max(0, likesCount - 1)
    setHasLiked(nextHasLiked)
    setLikesCount(nextCount)

    try {
      if (nextHasLiked) {
        await supabase.from('diary_likes').insert({
          user_id: currentUserId,
          diary_id: diary.id,
        })
      } else {
        await supabase
          .from('diary_likes')
          .delete()
          .eq('user_id', currentUserId)
          .eq('diary_id', diary.id)
      }
    } catch (err) {
      console.error('Failed to toggle like:', err)
      setHasLiked(!nextHasLiked)
      setLikesCount(likesCount)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !currentUserId || isSubmittingComment) return

    setIsSubmittingComment(true)
    const commentText = newComment.trim()
    setNewComment('')

    try {
      const { data, error } = await supabase
        .from('diary_comments')
        .insert({
          user_id: currentUserId,
          diary_id: diary.id,
          comment: commentText,
        })
        .select('id, user_id, comment, created_at, profiles(username)')
        .single()

      if (error) throw error

      if (data) {
        setComments((prev) => [...prev, data as unknown as DiaryComment])
      }
    } catch (err) {
      console.error('Failed to add comment:', err)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this diary memory?')) return
    setIsDeleting(true)

    try {
      const { error } = await supabase.from('hostel_diaries').delete().eq('id', diary.id)
      if (error) throw error
      router.refresh()
    } catch (err) {
      console.error('Failed to delete diary:', err)
      alert('Failed to delete diary memory.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-sm font-bold text-white overflow-hidden shadow-inner">
            {diary.profiles?.profile_pic_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={diary.profiles.profile_pic_url} alt={diary.profiles.username} className="h-full w-full object-cover" />
            ) : (
              diary.profiles?.username?.charAt(0).toUpperCase() || 'U'
            )}
          </div>
          <div>
            <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              {diary.profiles?.username || 'Hostel Resident'}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Hostel {diary.profiles?.hostel || 'SJ'} • {formatDate(diary.created_at)}
            </div>
          </div>
        </div>

        {canDelete && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
            title="Delete memory"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Image */}
      <div className="relative aspect-4/3 w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={diary.image_url}
          alt={diary.caption || 'Hostel memory photo'}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Caption & Actions */}
      <div className="p-4">
        {diary.caption && (
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-3">
            {diary.caption}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
          <button
            type="button"
            onClick={handleToggleLike}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors',
              hasLiked
                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
            )}
          >
            <Heart className={cn('h-4 w-4', hasLiked && 'fill-current text-rose-500')} />
            <span>{likesCount} Likes</span>
          </button>

          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{comments.length} Comments</span>
          </button>
        </div>

        {/* Expandable Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {comments.length === 0 ? (
                <p className="text-xs text-zinc-400 italic">No comments yet. Be the first!</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="rounded-lg bg-zinc-50 p-2 text-xs dark:bg-zinc-800/60">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 mr-2">
                      {c.profiles?.username || 'Resident'}:
                    </span>
                    <span className="text-zinc-700 dark:text-zinc-300">{c.comment}</span>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Input */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmittingComment}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
