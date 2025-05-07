'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminDashboard from '@/components/AdminDashboard'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Post, PostReport } from '@/types'

interface RawReport {
  id: string;
  created_at: string;
  post_id: string;
  reporter_id: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  admin_notes?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  posts: Post[];
}

export default function AdminPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAdminAndLoadReports() {
      if (!user) {
        router.push('/')
        return
      }

      // Check if user is admin
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select()
        .eq('user_id', user.id)
        .single()

      if (!adminUser) {
        router.push('/')
        return
      }

      // Get reported posts
      const { data: reportData } = await supabase
        .from('post_reports')
        .select(`
          id,
          created_at,
          post_id,
          reporter_id,
          reason,
          status,
          admin_notes,
          reviewed_at,
          reviewed_by,
          posts:post_id (
            id,
            content,
            user_id,
            user_email,
            created_at,
            moderation_result
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      setReports(reportData || [])
      setLoading(false)
    }

    checkAdminAndLoadReports()
  }, [user, router])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-12 h-12 rounded-full border-t-2 border-b-2 border-indigo-500 animate-spin"></div>
      </div>
    )
  }

  return <AdminDashboard reports={reports} />
}
