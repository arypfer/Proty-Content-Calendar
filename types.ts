export enum PostStatus {
  Draft = 'Draft',
  PendingReview = 'Pending Review',
  NeedsRevision = 'Needs Revision',
  Approved = 'Approved',
}

export interface Comment {
  id: string;
  author: 'Designer' | 'Reviewer';
  text: string;
  timestamp: Date;
}

export interface Post {
  id: string;
  date: Date;
  images: string[]; // Array of base64 encoded image strings
  caption: string;
  status: PostStatus;
  comments: Comment[];
}