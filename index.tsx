import React, { useState, useMemo, useCallback, useEffect, ChangeEvent } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// =================================================================
// INLINED TYPES, CONSTANTS, AND SERVICES
// =================================================================

enum PostStatus {
  Draft = 'Draft',
  PendingReview = 'Pending Review',
  NeedsRevision = 'Needs Revision',
  Approved = 'Approved',
}

interface Comment {
  id: string;
  author: 'Designer' | 'Reviewer';
  text: string;
  timestamp: Date;
}

interface Post {
  id: string;
  date: Date;
  images: string[];
  caption: string;
  status: PostStatus;
  comments: Comment[];
}

const STATUS_COLORS: Record<PostStatus, { bg: string; text: string; ring: string }> = {
  [PostStatus.Draft]: { bg: 'bg-gray-100', text: 'text-gray-800', ring: 'ring-gray-300' },
  [PostStatus.PendingReview]: { bg: 'bg-blue-100', text: 'text-blue-800', ring: 'ring-blue-300' },
  [PostStatus.NeedsRevision]: { bg: 'bg-orange-100', text: 'text-orange-800', ring: 'ring-orange-300' },
  [PostStatus.Approved]: { bg: 'bg-green-100', text: 'text-green-800', ring: 'ring-green-300' },
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const base64ToInlineData = (base64String: string) => {
  const [metadata, data] = base64String.split(',');
  const mimeType = metadata.match(/:(.*?);/)?.[1] || 'image/jpeg';
  return {
    inlineData: {
      mimeType,
      data,
    },
  };
};

const suggestCaption = async (images: string[]): Promise<string> => {
  if (!API_KEY) {
    return "API Key not configured. Please set the API_KEY environment variable.";
  }

  try {
    const imageParts = images.map(base64ToInlineData);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                ...imageParts,
                { text: "Write a captivating Instagram caption for these images. Include relevant hashtags. The caption should be engaging and encourage interaction." }
            ]
        },
    });

    return response.text;
  } catch (error) {
    console.error("Error generating caption with Gemini API:", error);
    return "Sorry, I couldn't generate a caption right now. Please try again later.";
  }
};

// =================================================================
// COMPONENTS
// =================================================================

interface ImageCarouselProps {
  images: string[];
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    const isFirstImage = currentIndex === 0;
    const newIndex = isFirstImage ? images.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    const isLastImage = currentIndex === images.length - 1;
    const newIndex = isLastImage ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  if (images.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500 rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full group">
      <div className="w-full h-full">
        <img
          src={images[currentIndex]}
          alt={`Post image ${currentIndex + 1}`}
          className="w-full h-full object-contain"
        />
      </div>
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full hover:bg-opacity-60 transition-opacity opacity-0 group-hover:opacity-100"
            aria-label="Previous image"
          >
            &#10094;
          </button>
          <button
            onClick={goToNext}
            className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full hover:bg-opacity-60 transition-opacity opacity-0 group-hover:opacity-100"
            aria-label="Next image"
          >
            &#10095;
          </button>
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {images.map((_, index) => (
              <div
                key={index}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${currentIndex === index ? 'bg-white' : 'bg-gray-400 bg-opacity-70'}`}
              ></div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};


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


interface CalendarProps {
  currentDate: Date;
  postsByDate: Map<string, Post[]>;
  onSelectDate: (date: Date) => void;
  onSelectPost: (post: Post) => void;
}

const Calendar: React.FC<CalendarProps> = ({ currentDate, postsByDate, onSelectDate, onSelectPost }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const daysInMonth: Date[] = [];
  for (let date = new Date(firstDayOfMonth); date <= lastDayOfMonth; date.setDate(date.getDate() + 1)) {
    daysInMonth.push(new Date(date));
  }
  
  const startingDayOfWeek = firstDayOfMonth.getDay();
  
  const today = new Date();
  const isToday = (date: Date) => 
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  return (
    <div className="bg-brand-surface rounded-xl shadow-lg border border-gray-200">
      <div className="grid grid-cols-7 border-b border-gray-200">
        {DAY_NAMES.map(day => (
          <div key={day} className="py-3 text-center font-semibold text-xs text-brand-text-secondary uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: startingDayOfWeek }).map((_, index) => (
          <div key={`empty-${index}`} className="border-r border-b border-gray-200 bg-gray-50"></div>
        ))}
        {daysInMonth.map((date, index) => {
          const dateKey = date.toDateString();
          const postsForDay = postsByDate.get(dateKey) || [];
          const cellIsToday = isToday(date);
          const isLastCol = (startingDayOfWeek + index) % 7 === 6;
          const isLastRow = Math.ceil((startingDayOfWeek + daysInMonth.length) / 7) === Math.ceil((startingDayOfWeek + index + 1) / 7);

          return (
            <div
              key={date.toString()}
              className={`relative p-2 flex flex-col group hover:bg-blue-50 transition-colors duration-200
                ${!isLastCol ? 'border-r' : ''}
                ${!isLastRow ? 'border-b' : ''}
                border-gray-200 min-h-[100px] sm:min-h-[140px] lg:min-h-[180px]
              `}
              onClick={() => onSelectDate(date)}
            >
              <time
                dateTime={date.toISOString()}
                className={`flex items-center justify-center text-sm w-7 h-7 rounded-full font-semibold ${
                  cellIsToday ? 'bg-brand-primary text-white' : 'text-brand-text-secondary'
                }`}
              >
                {date.getDate()}
              </time>
              <div className="mt-2 space-y-2 overflow-y-auto flex-grow">
                {postsForDay.map(post => (
                  <PostCard key={post.id} post={post} onSelectPost={onSelectPost} />
                ))}
              </div>
              <button 
                className="absolute bottom-2 right-2 w-7 h-7 bg-brand-primary text-white rounded-full flex items-center justify-center text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md hover:bg-blue-600"
                onClick={(e) => { e.stopPropagation(); onSelectDate(date); }}
                aria-label="Add new post"
              >
                +
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};


// =================================================================
// MAIN APP COMPONENT
// =================================================================

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<Post[]>([
    {
      id: '1',
      date: new Date(new Date().setDate(10)),
      images: ['https://picsum.photos/id/1018/1080/1080', 'https://picsum.photos/id/1015/1080/1080'],
      caption: 'Exploring the serene beauty of the mountains. #Nature #Adventure #Travel',
      status: PostStatus.Approved,
      comments: [
        { id: 'c1', author: 'Reviewer', text: 'Looks great! Approved.', timestamp: new Date() }
      ]
    },
    {
      id: '2',
      date: new Date(new Date().setDate(22)),
      images: ['https://picsum.photos/id/1025/1080/1080'],
      caption: 'A happy pup enjoying the day! 🐶',
      status: PostStatus.NeedsRevision,
      comments: [
        { id: 'c2', author: 'Reviewer', text: 'Can we try a different caption? Something more engaging.', timestamp: new Date() }
      ]
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const postsByDate = useMemo(() => {
    const map = new Map<string, Post[]>();
    posts.forEach(post => {
      const dateKey = post.date.toDateString();
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)?.push(post);
    });
    return map;
  }, [posts]);

  const handleSelectDate = useCallback((date: Date) => {
    setSelectedDate(date);
    setSelectedPost(null);
    setIsModalOpen(true);
  }, []);

  const handleSelectPost = useCallback((post: Post) => {
    setSelectedPost(post);
    setSelectedDate(null);
    setIsModalOpen(true);
  }, []);
  
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedPost(null);
    setSelectedDate(null);
  }, []);

  const handleSavePost = useCallback((postToSave: Omit<Post, 'id'> & { id?: string }) => {
    if (postToSave.id) {
      setPosts(prevPosts => prevPosts.map(p => p.id === postToSave.id ? { ...p, ...postToSave, id: postToSave.id } : p));
    } else {
      const newPost: Post = {
        ...postToSave,
        id: new Date().toISOString(),
      };
      setPosts(prevPosts => [...prevPosts, newPost]);
    }
    handleCloseModal();
  }, [handleCloseModal]);
  
  const handleDeletePost = useCallback((postId: string) => {
    setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
    handleCloseModal();
  }, [handleCloseModal]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="min-h-screen text-brand-text-primary p-2 sm:p-6 lg:p-8 font-sans">
      <header className="flex flex-col sm:flex-row items-center sm:justify-between mb-8">
        <div className="text-center sm:text-left mb-4 sm:mb-0">
          <h1 className="text-3xl font-bold text-brand-text-primary">Proty</h1>
          <h2 className="text-2xl font-semibold text-brand-text-secondary">
            {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
        </div>
        <div className="flex items-center justify-center space-x-2">
          <button onClick={goToToday} className="px-4 py-2 text-sm font-medium text-brand-text-primary bg-brand-surface border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors">
            Today
          </button>
          <button onClick={goToPreviousMonth} className="p-2 text-brand-text-secondary bg-brand-surface border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <button onClick={goToNextMonth} className="p-2 text-brand-text-secondary bg-brand-surface border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </header>

      <main>
        <Calendar 
          currentDate={currentDate} 
          postsByDate={postsByDate} 
          onSelectDate={handleSelectDate}
          onSelectPost={handleSelectPost}
        />
      </main>

      {isModalOpen && (
        <PostModal 
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          post={selectedPost}
          date={selectedDate}
          onSave={handleSavePost}
          onDelete={handleDeletePost}
        />
      )}
    </div>
  );
};

// =================================================================
// RENDER APP
// =================================================================

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);