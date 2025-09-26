import React from 'react';
import { Post } from '../types';
import { DAY_NAMES } from '../constants';
import PostCard from './PostCard';

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

export default Calendar;