'use client'

import { useState } from 'react'
import type { Post } from '@/types'

export default function PostHistory({ posts }: { posts: Post[] }) {
  const [filter, setFilter] = useState<'all' | 'flagged'>('all')

  const filteredPosts = filter === 'all' 
    ? posts 
    : posts.filter(post => post.moderation_result.flagged)

  const getModerationColor = (post: Post) => {
    if (!post.moderation_result.flagged) return 'bg-green-100'
    switch (post.moderation_result.severity) {
      case 'high':
        return 'bg-red-100'
      case 'medium':
        return 'bg-yellow-100'
      default:
        return 'bg-blue-100'
    }
  }

  const getStatusText = (post: Post) => {
    if (!post.moderation_result.flagged) return 'Approved'
    return `Flagged (${post.moderation_result.severity} severity)`
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filter === 'all'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            All Posts ({posts.length})
          </button>
          <button
            onClick={() => setFilter('flagged')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filter === 'flagged'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            Flagged Posts ({posts.filter(p => p.moderation_result.flagged).length})
          </button>
        </div>
      </div>

      {filteredPosts.length === 0 ? (
        <p className="text-gray-500">
          {filter === 'all' 
            ? 'You haven\'t created any posts yet.' 
            : 'None of your posts have been flagged.'}
        </p>
      ) : (
        <div className="space-y-6">
          {filteredPosts.map(post => (
            <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <p className="text-gray-800 mb-4">{post.content}</p>
                <div className="text-sm text-gray-500">
                  Posted on {new Date(post.created_at).toLocaleString()}
                </div>
              </div>
              <div className={`${getModerationColor(post)} px-6 py-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{getStatusText(post)}</h4>
                    {post.moderation_result.reason && (
                      <p className="text-sm text-gray-600 mt-1">
                        {post.moderation_result.reason}
                      </p>
                    )}
                  </div>
                  {post.moderation_result.confidence && (
                    <div className="text-sm text-gray-600">
                      Confidence: {Math.round(post.moderation_result.confidence * 100)}%
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
