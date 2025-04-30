import { Post } from '@/types';
import { formatDate } from '@/lib/utils';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface ModeratedContentProps {
  post: Post;
}

export default function ModeratedContent({ post }: ModeratedContentProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-900">{post.text}</p>
          <div className="mt-2 flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              Posted by {post.author || 'Anonymous'}
            </span>
            <span className="text-sm text-gray-500">
              {formatDate(post.createdAt)}
            </span>
          </div>
        </div>
        
        <div className="ml-4 flex-shrink-0">
          <div className="flex items-center text-sm text-green-600">
            <CheckCircleIcon className="h-5 w-5 mr-1" />
            Approved
          </div>
        </div>
      </div>

      {post.moderationResult && (
        <div className="mt-2 text-xs text-gray-500">
          <p>Confidence: {Math.round(post.moderationResult.confidence * 100)}%</p>
          <p>Severity: {post.moderationResult.severity}</p>
        </div>
      )}
    </div>
  );
}
