import React from 'react';
import { Post } from '../types';
import { STATUS_COLORS } from '../constants';

interface PostCardProps {
  post: Post;
  onSelectPost: (post: Post) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onSelectPost }) => {
  const statusColor = STATUS_COLORS[post.status];

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelectPost(post);
      }}
      className="p-2 rounded-lg cursor-pointer bg-brand-surface border border-gray-200 hover:shadow-md hover:border-brand-primary transition-all duration-200"
    >
      <div className="flex items-start space-x-2">
        {post.images[0] && (
           <img
             src={post.images[0]}
             alt="Post thumbnail"
             className="w-10 h-10 rounded-md object-cover flex-shrink-0"
           />
        )}
        <div className="flex-grow min-w-0">
          <p className="text-sm font-medium text-brand-text-primary truncate">{post.caption || 'No caption'}</p>
          <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full ${statusColor.bg} ${statusColor.text}`}>
            {post.status}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PostCard;