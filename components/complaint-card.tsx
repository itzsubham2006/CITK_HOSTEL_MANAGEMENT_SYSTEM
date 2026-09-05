'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Calendar, MapPin, CheckCircle2, Clock, AlertTriangle, Image as ImageIcon } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import UpvoteButton from './upvote-button'
import { createClient } from '@/lib/supabase/client'
import { ComplaintCategory, ComplaintStatus, HostelName, UserRole } from '@/types/database.types'

interface ComplaintCardProps {
  complaint: {
    id: number
    user_id: string
    hostel: HostelName
    category: ComplaintCategory
    description: string
    status: ComplaintStatus
    image_url: string | null
    upvotes: number
    created_at: string
    profiles?: {
      username: string
      room_no: string
      profile_pic_url: string | null
    }
  }
  currentUserId?: string
  currentUserRole?: UserRole
  hasUpvoted?: boolean
}

const statusConfig = {
  Pending: {
    label: 'Pending',
    icon: Clock,
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  'In Progress': {
    label: 'In Progress',
    icon: AlertTriangle,
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  Resolved: {
    label: 'Resolved',
    icon: CheckCircle2,
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
}

const categoryIcons: Record<ComplaintCategory, string> = {
  Electricity: '⚡',
  Water: '💧',
  Cleanliness: '🧹',
  Food: '🍲',
  Furniture: '🪑',
  Internet: '📶',
  Security: '🛡️',
  Bathroom: '🚿',
  Other: '📌',
}

export default function ComplaintCard({
  complaint,
  currentUserId,
  currentUserRole = 'student',
  hasUpvoted = false,
}: ComplaintCardProps) {
  const router = useRouter()
  const [status, setStatus] = useState<ComplaintStatus>(complaint.status)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const supabase = createClient()

  const isAuthor = currentUserId === complaint.user_id
  const isAdminOrWarden = currentUserRole === 'admin' || currentUserRole === 'warden'
  const canDelete = isAuthor || isAdminOrWarden

  const handleStatusChange = async (newStatus: ComplaintStatus) => {
    if (!isAdminOrWarden || isUpdatingStatus) return
    setIsUpdatingStatus(true)
    setStatus(newStatus)

    try {
      const { error } = await supabase
        .from('complaints')
        .update({ status: newStatus })
        .eq('id', complaint.id)

      if (error) throw error
      router.refresh()
    } catch (err) {
      console.error('Failed to update status:', err)
      setStatus(complaint.status)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this issue?')) return
    setIsDeleting(true)

    try {
      const { error } = await supabase
        .from('complaints')
        .delete()
        .eq('id', complaint.id)

      if (error) throw error
      router.refresh()
    } catch (err) {
      console.error('Failed to delete complaint:', err)
      alert('Failed to delete issue.')
    } finally {
      setIsDeleting(false)
    }
  }

  const StatusIcon = statusConfig[status]?.icon || Clock

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between">
      <div>
        {/* Header: Category & Status */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
              <span>{categoryIcons[complaint.category] || '📌'}</span>
              <span>{complaint.category}</span>
            </span>

            <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <MapPin className="h-3.5 w-3.5" />
              <span>{complaint.hostel}</span>
            </span>
          </div>

          {isAdminOrWarden ? (
            <select
              value={status}
              disabled={isUpdatingStatus}
              onChange={(e) => handleStatusChange(e.target.value as ComplaintStatus)}
              className={cn(
                'rounded-lg border px-2.5 py-1 text-xs font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500',
                statusConfig[status]?.badgeClass
              )}
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          ) : (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                statusConfig[status]?.badgeClass
              )}
            >
              <StatusIcon className="h-3 w-3" />
              <span>{statusConfig[status]?.label}</span>
            </span>
          )}
        </div>

        {/* Issue Description */}
        <p className="text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed mb-4">
          {complaint.description}
        </p>

        {/* Attached Image Preview */}
        {complaint.image_url && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowImageModal(true)}
              className="group relative flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <ImageIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>View attached photo</span>
            </button>

            {showImageModal && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                onClick={() => setShowImageModal(false)}
              >
                <div className="relative max-w-2xl max-h-[90vh] overflow-auto bg-white rounded-xl p-2 dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={complaint.image_url} alt="Attached issue photo" className="rounded-lg object-contain max-h-[80vh] w-full" />
                  <button
                    onClick={() => setShowImageModal(false)}
                    className="absolute top-4 right-4 rounded-full bg-black/60 px-3 py-1 text-xs text-white hover:bg-black"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer: User info, Date, Upvotes & Actions */}
      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-2">
          <div className="font-semibold text-zinc-700 dark:text-zinc-300">
            {complaint.profiles?.username || 'Resident'}
            {complaint.profiles?.room_no && ` (Room ${complaint.profiles.room_no})`}
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(complaint.created_at)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <UpvoteButton
            complaintId={complaint.id}
            initialUpvotes={complaint.upvotes}
            hasUpvoted={hasUpvoted}
            userId={currentUserId}
          />

          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
              title="Delete complaint"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
