'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import Auth from '@/components/Auth'
import ContentForm from '@/components/ContentForm'
import ModeratedContent from '@/components/ModeratedContent'
import { Post, UserPostMetrics } from '@/types'
import Image from 'next/image'
import { fetchPosts, fetchUserMetrics } from '@/lib/api'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const { user, loading, signOut } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [userMetrics, setUserMetrics] = useState<UserPostMetrics | null>(null)
  const [fetchingPosts, setFetchingPosts] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const loadPosts = async () => {
    try {
      setFetchingPosts(true)
      const result = await fetchPosts()
      if (!('error' in result)) {
        setPosts(result)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setFetchingPosts(false)
    }
  }

  const loadUserMetrics = async () => {
    if (user) {
      const metrics = await fetchUserMetrics(user.id)
      if (!('error' in metrics)) {
        setUserMetrics(metrics)
      }
    }
  }

  const checkAdminStatus = async () => {
    if (user) {
      console.log('Checking admin status for user:', user)
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select()
        .eq('user_id', user.id)
        .single()
      console.log('Admin user:', adminUser)
      setIsAdmin(!!adminUser)
    }
  }

  useEffect(() => {
    if (user) {
      loadPosts()
      loadUserMetrics()
      checkAdminStatus()
    }
  }, [user])

  const handlePostSubmit = async () => {
    await loadPosts()
    await loadUserMetrics()
  }

  if (loading || fetchingPosts) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-12 h-12 rounded-full border-t-2 border-b-2 border-indigo-500 animate-spin"></div>
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="container px-4 py-4 mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="relative w-8 h-8">
                <Image
                  src="/logo.svg"
                  alt="ContentGuard Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">
                ContentGuard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {userMetrics && (
                <div className="text-sm text-gray-600">
                  Posts today: {userMetrics.post_count_last_hour}/10
                </div>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg transition-all duration-200 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Admin Dashboard
                </Link>
              )}
              <span className="text-sm text-gray-600">{user.email}</span>
              <button
                onClick={signOut}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg transition-all duration-200 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container px-4 py-8 mx-auto">
        <ContentForm onPostSubmit={handlePostSubmit} />
        <ModeratedContent posts={posts} onPostReport={loadPosts} />
      </main>
    </div>
  )
}
