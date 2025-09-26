import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { Post, Comment, PostStatus } from '../types';
import { suggestCaption } from '../services/geminiService';
import ImageCarousel from './ImageCarousel';

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post | null;
  date: Date | null;
  onSave: (post: Omit<Post, 'id'> & { id?: string }) => void;
  onDelete: (postId: string) => void;
}

const PostModal: React.FC<PostModalProps> = ({ isOpen, onClose, post, date, onSave, onDelete }) => {
  const [images, setImages] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [status, setStatus] = useState<PostStatus>(PostStatus.Draft);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);

  useEffect(() => {
    if (post) {
      setImages(post.images);
      setCaption(post.caption);
      setStatus(post.status);
      setComments(post.comments);
    } else {
      setImages([]);
      setCaption('');
      setStatus(PostStatus.Draft);
      setComments([]);
    }
  }, [post]);
  
  const handleSave = () => {
    const postDate = post?.date || date;
    if (!postDate) return;
    onSave({ id: post?.id, date: postDate, images, caption, status, comments });
  };
  
  const handleDelete = () => {
    if (post && window.confirm('Are you sure you want to delete this post?')) {
        onDelete(post.id);
    }
  }

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newImages: string[] = [];
      let filesProcessed = 0;

      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            newImages.push(reader.result);
          }
          filesProcessed++;
          if (filesProcessed === files.length) {
            setImages(prevImages => [...prevImages, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };
  
  const handleGenerateCaption = async () => {
    if (images.length === 0) {
        alert('Please upload at least one image to generate a caption.');
        return;
    }
    setIsGeneratingCaption(true);
    const generatedCaption = await suggestCaption(images);
    setCaption(generatedCaption);
    setIsGeneratingCaption(false);
  };

  const handleAddComment = (author: 'Designer' | 'Reviewer') => {
    if (newComment.trim() === '') return;
    const comment: Comment = {
        id: new Date().toISOString(),
        author,
        text: newComment,
        timestamp: new Date()
    };
    setComments(prev => [...prev, comment]);
    setNewComment('');
  };

  if (!isOpen) return null;

  const modalTitle = post ? 'Edit Post' : 'Create Post';
  const displayDate = (post?.date || date)?.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-brand-surface rounded-xl shadow-2xl w-full max-w-lg md:max-w-3xl lg:max-w-5xl max-h-[95vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold text-brand-text-primary">{modalTitle} for {displayDate}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-3xl leading-none">&times;</button>
        </div>
        
        <div className="flex-grow overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Images & Upload */}
          <div className="flex flex-col space-y-4">
            <h3 className="font-semibold text-brand-text-primary">Carousel Images</h3>
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                <ImageCarousel images={images} />
            </div>
             <input
                id="file-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <label htmlFor="file-upload" className="w-full text-center px-4 py-2.5 text-sm font-semibold text-white bg-brand-primary rounded-lg shadow-sm hover:bg-blue-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors">
                Upload Images
              </label>
          </div>
          
          {/* Right Column: Details & Comments */}
          <div className="flex flex-col space-y-6">
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label htmlFor="caption" className="font-semibold text-brand-text-primary">Caption</label>
                    <button onClick={handleGenerateCaption} disabled={isGeneratingCaption || images.length === 0} className="px-3 py-1.5 text-xs font-semibold text-white bg-brand-primary rounded-md shadow-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
                        {isGeneratingCaption ? 'Generating...' : '✨ Suggest with AI'}
                    </button>
                </div>
                <textarea id="caption" value={caption} onChange={e => setCaption(e.target.value)} rows={6} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-brand-primary focus:border-brand-primary bg-white text-brand-text-primary placeholder-gray-400 transition-colors"></textarea>
            </div>
            
            <div>
                <label htmlFor="status" className="font-semibold text-brand-text-primary">Status</label>
                <select id="status" value={status} onChange={e => setStatus(e.target.value as PostStatus)} className="w-full p-3 mt-2 border border-gray-300 rounded-lg focus:ring-brand-primary focus:border-brand-primary bg-white text-brand-text-primary transition-colors">
                    {Object.values(PostStatus).map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>

            <div className="flex-grow flex flex-col">
              <h3 className="font-semibold text-brand-text-primary mb-2">Revisions & Feedback</h3>
              <div className="flex-grow bg-gray-50 p-3 rounded-lg space-y-3 overflow-y-auto border border-gray-200 min-h-[150px]">
                {comments.length === 0 ? <p className="text-sm text-gray-500 text-center py-4">No comments yet.</p> : comments.map(c => (
                    <div key={c.id} className={`flex flex-col ${c.author === 'Reviewer' ? 'items-start' : 'items-end'}`}>
                        <div className={`p-3 rounded-lg max-w-xs shadow-sm ${c.author === 'Reviewer' ? 'bg-brand-secondary text-white' : 'bg-brand-primary text-white'}`}>
                            <p className="text-sm">{c.text}</p>
                            <p className="text-xs opacity-80 mt-1 text-right">{c.author} - {c.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>
                ))}
              </div>
              <div className="mt-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Type your feedback here..."
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-brand-primary focus:border-brand-primary resize-y bg-white text-brand-text-primary placeholder-gray-400 transition-colors"
                  aria-label="Add a comment"
                />
                <div className="mt-2 flex flex-col sm:flex-row sm:justify-end gap-2">
                  <button onClick={() => handleAddComment('Designer')} className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-white bg-brand-primary rounded-lg shadow-sm hover:bg-blue-700 transition-colors">
                    Comment as Designer
                  </button>
                  <button onClick={() => handleAddComment('Reviewer')} className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-white bg-brand-secondary rounded-lg shadow-sm hover:bg-orange-600 transition-colors">
                    Comment as Reviewer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-gray-200 flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-3 flex-shrink-0">
            <div className="w-full sm:w-auto">
              {post && <button onClick={handleDelete} className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg shadow-sm hover:bg-red-700 transition-colors">Delete Post</button>}
            </div>
            <div className="w-full sm:w-auto flex flex-col-reverse sm:flex-row gap-3 sm:gap-2">
              <button onClick={onClose} className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-brand-text-primary bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 transition-colors">Cancel</button>
              <button onClick={handleSave} className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-white bg-brand-primary rounded-lg shadow-sm hover:bg-blue-700 transition-colors">Save Post</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PostModal;