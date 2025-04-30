import { useState } from 'react';
import { Post } from '@/types';
import { moderateContent, createPost } from '@/lib/api';

interface ContentFormProps {
  onPostSuccess: (post: Post) => void;
}

export default function ContentForm({ onPostSuccess }: ContentFormProps) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // First, moderate the content
      const moderationResult = await moderateContent(content);

      if (moderationResult.flagged) {
        setError(`Content flagged: ${moderationResult.reason}`);
        return;
      }

      // If content is safe, create the post
      const post = await createPost(content);
      onPostSuccess(post);
      setContent('');
      
    } catch (err) {
      setError('Failed to submit content. Please try again.');
      console.error('Submission error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="content"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Your Content
        </label>
        <textarea
          id="content"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Write your content here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isLoading}
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !content.trim()}
        className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isLoading ? 'Checking...' : 'Submit Content'}
      </button>
    </form>
  );
}
