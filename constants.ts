import { PostStatus } from './types';

export const STATUS_COLORS: Record<PostStatus, { bg: string; text: string; ring: string }> = {
  [PostStatus.Draft]: { bg: 'bg-gray-100', text: 'text-gray-800', ring: 'ring-gray-300' },
  [PostStatus.PendingReview]: { bg: 'bg-blue-100', text: 'text-blue-800', ring: 'ring-blue-300' },
  [PostStatus.NeedsRevision]: { bg: 'bg-orange-100', text: 'text-orange-800', ring: 'ring-orange-300' },
  [PostStatus.Approved]: { bg: 'bg-green-100', text: 'text-green-800', ring: 'ring-green-300' },
};

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];