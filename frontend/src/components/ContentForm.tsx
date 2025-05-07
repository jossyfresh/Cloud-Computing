'use client'
import { toast } from 'react-toastify';
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Post } from '@/types'
import {moderateContent} from '@/lib/api'
import { supabase } from '@/lib/supabase';
import { postContent } from '@/lib/api';

interface ContentFormProps {
  onPostSubmit: () => void
}

export default function ContentForm({ onPostSubmit }: ContentFormProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !user) return

    setLoading(true)
    try {
      const moderationResult = await moderateContent(content)
      if (moderationResult.flagged) {
        toast('Post not approved', {
          type: 'error',
          position: 'top-right',
          autoClose: 5000,
          });
        return
      }
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        return  
      }
      
      const result = await postContent(content)

      if (result && result.error) {
        toast('Failed to submit post', {
          type: 'error',
          position: 'top-right',
          autoClose: 5000,
        })
        return
      }

      onPostSubmit();
      setContent('')
    } catch (error) {
      console.error('Error submitting post:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 mb-8 bg-white rounded-2xl shadow-lg">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="content"
              className="block mb-2 text-lg font-semibold text-gray-900"
            >
              Share Your Thoughts
            </label>
            <div className="relative">
              <textarea
                id="content"
                rows={4}
                className="block px-6 py-4 w-full text-base rounded-xl border-2 border-gray-200 shadow-sm transition-all duration-200 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={loading}
              />
              <div className="absolute right-4 bottom-4 text-sm text-gray-400">
                {content.length} / 1000
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-md hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <>
                  <svg
                    className="mr-3 -ml-1 w-5 h-5 text-white animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Posting...
                </>
              ) : (
                'Share Post'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
