'use client'

import { useState } from 'react'
import { ThumbsUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface UpvoteButtonProps {
  complaintId: number
  initialUpvotes: number
  hasUpvoted: boolean
  userId?: string
}

export default function UpvoteButton({
  complaintId,
  initialUpvotes,
  hasUpvoted: initialHasUpvoted,
  userId,
}: UpvoteButtonProps) {
  const [upvotes, setUpvotes] = useState(initialUpvotes)
  const [hasUpvoted, setHasUpvoted] = useState(initialHasUpvoted)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleToggleUpvote = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!userId || loading) return

    // Optimistic update
    const nextHasUpvoted = !hasUpvoted
    const nextCount = nextHasUpvoted ? upvotes + 1 : Math.max(0, upvotes - 1)
    setHasUpvoted(nextHasUpvoted)
    setUpvotes(nextCount)
    setLoading(true)

    try {
      if (nextHasUpvoted) {
        const { error } = await supabase.from('complaint_upvotes').insert({
          user_id: userId,
          complaint_id: complaintId,
        })
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('complaint_upvotes')
          .delete()
          .eq('user_id', userId)
          .eq('complaint_id', complaintId)
        if (error) throw error
      }
    } catch (err) {
      console.error('Failed to update upvote:', err)
      // Rollback
      setHasUpvoted(!nextHasUpvoted)
      setUpvotes(upvotes)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggleUpvote}
      disabled={loading || !userId}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-150',
        hasUpvoted
          ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700'
          : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
      )}
      title={hasUpvoted ? 'Remove upvote' : 'Upvote this issue'}
    >
      <ThumbsUp className={cn('h-3.5 w-3.5', hasUpvoted ? 'fill-current' : '')} />
      <span>{upvotes}</span>
    </button>
  )
}
