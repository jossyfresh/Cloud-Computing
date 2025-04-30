'use client';

import { useState } from 'react';
import ContentForm from '@/components/ContentForm';
import ModeratedContent from '@/components/ModeratedContent';
import { Post } from '@/types';

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);

  const addPost = (post: Post) => {
    setPosts((prevPosts) => [post, ...prevPosts]);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        Content Moderation System
      </h1>
      
      <div className="max-w-2xl mx-auto">
        <ContentForm onPostSuccess={addPost} />
        
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-4">Recent Posts</h2>
          {posts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No posts yet. Be the first to create one!
            </p>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <ModeratedContent key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
