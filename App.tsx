import React, { useState, useMemo, useCallback } from 'react';
import { Post, PostStatus } from './types';
import Calendar from './components/Calendar';
import PostModal from './components/PostModal';
import { MONTH_NAMES } from './constants';

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

export default App;