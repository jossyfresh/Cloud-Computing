'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useState } from 'react'
import type { PostReport } from '@/types'
import Link from 'next/link'

export default function AdminDashboard({ reports: initialReports }: { reports: PostReport[] }) {
  const [reports, setReports] = useState(initialReports)
  const [loadingAction, setLoadingAction] = useState<{ id: string; action: 'dismiss' | 'remove' } | null>(null)
  const supabase = createClientComponentClient()


  console.log(reports)
  const handleAction = async (reportId: string, action: 'dismiss' | 'remove') => {
    setLoadingAction({ id: reportId, action })
    try {
      const report = reports.find(r => r.id === reportId)
      if (!report) return

      if (action === 'remove') {
        // Remove post from posts table
        const { error: postError } = await supabase
          .from('posts')
          .delete()
          .eq('id', report.post_id)

        if (postError) throw postError
      }

      // Remove report from post reports table
      const { error: reportError } = await supabase
        .from('post_reports')
        .delete()
        .eq('id', reportId)

      if (reportError) throw reportError

      // Update local state
      setReports(reports.filter(r => r.id !== reportId))

    } catch (error) {
      console.error('Error handling report:', error)
      alert('Failed to process report')
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard - Reported Posts</h1>
        <Link 
          href="/"
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50"
        >
          <svg 
            className="mr-2 w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
            />
          </svg>
          Home
        </Link>
      </div>
      
      {reports.length === 0 ? (
        <p className="text-gray-500">No pending reports</p>
      ) : (
        <div className="space-y-6">
          {reports.map(report => (
            <div key={report.id} className="p-6 bg-white rounded-lg shadow-md">
              <div className="mb-4">
                <h3 className="font-semibold">Reported Content:</h3>
                <p className="mt-2 text-gray-700">{report.posts?.content}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
                <div>
                  <p>Posted: {new Date(report.posts?.created_at || '').toLocaleString()}</p>
                  <p>Author: {report.posts?.user_email}</p>
                  {report.posts?.moderation_result.flagged && (
                    <p className="text-red-600">
                      Currently Flagged: {report.posts.moderation_result.reason || 'No reason provided'}
                    </p>
                  )}
                </div>
                <div>
                  <p>Report Reason: {report.reason}</p>
                  <p>Reported: {new Date(report.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => handleAction(report.id, 'dismiss')}
                  disabled={loadingAction !== null && loadingAction.id === report.id}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingAction?.id === report.id && loadingAction.action === 'dismiss' ? (
                    <span className="flex items-center">
                      <svg className="mr-2 w-4 h-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Dismissing...
                    </span>
                  ) : (
                    'Dismiss Report'
                  )}
                </button>
                <button
                  onClick={() => handleAction(report.id, 'remove')}
                  disabled={loadingAction !== null && loadingAction.id === report.id}
                  className="px-4 py-2 text-white bg-red-500 rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingAction?.id === report.id && loadingAction.action === 'remove' ? (
                    <span className="flex items-center">
                      <svg className="mr-2 w-4 h-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Removing...
                    </span>
                  ) : (
                    'Remove Post'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
