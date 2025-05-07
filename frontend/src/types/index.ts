export interface ModerationResult {
  flagged: boolean;
  reason: string | null;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  categories?: Record<string, boolean>;
  categoryScores?: Record<string, number>;
}

export interface Post {
  id: string;
  created_at: string;
  user_id: string;
  user_email: string;
  content: string;
  moderation_result: ModerationResult;
}

export interface PostReport {
  id: string;
  created_at: string;
  post_id: string;
  reporter_id: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  admin_notes?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  posts: Post;
  reporter?: { email: string } | null;
}

export interface UserPostMetrics {
  user_id: string;
  post_count_last_hour: number;
  last_post_time?: string;
  total_posts: number;
  flagged_posts: number;
  updated_at: string;
}

export interface AdminUser {
  user_id: string;
  created_at: string;
  created_by?: string;
  email_notifications: boolean;
}

export interface Notification {
  id: string;
  created_at: string;
  user_id: string;
  type: 'post_report' | 'moderation_flag' | 'system';
  title: string;
  content: string;
  read: boolean;
  post_id?: string;
  report_id?: string;
}
