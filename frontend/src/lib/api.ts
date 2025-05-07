import { Post, ModerationResult, UserPostMetrics } from '@/types';
import { supabase } from '@/lib/supabase';

// Moderation function that calls the backend moderation service
export async function moderateContent(text: string): Promise<ModerationResult> {
  try {
    const response = await fetch('http://localhost:3001/api/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    return response.json();
  } catch (error) {
    console.error('Moderation API error:', error);
    throw new Error('Failed to moderate content');
  }
}

// Check rate limit before posting
async function checkRateLimit(userId: string): Promise<boolean> {
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const { data: metrics } = await supabase
    .from('post_metrics')
    .select()
    .eq('user_id', userId)
    .single();

  if (metrics?.post_count_last_hour >= 10 && 
      metrics?.last_post_time && 
      new Date(metrics.last_post_time) > hourAgo) {
    return false;
  }

  return true;
}

// Update user metrics after posting
async function updateUserMetrics(userId: string, flagged: boolean) {
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const { data: metrics } = await supabase
    .from('post_metrics')
    .select()
    .eq('user_id', userId)
    .single();

  const newMetrics = {
    user_id: userId,
    post_count_last_hour: metrics?.last_post_time && new Date(metrics.last_post_time) > hourAgo 
      ? (metrics.post_count_last_hour || 0) + 1 
      : 1,
    last_post_time: now.toISOString(),
    total_posts: (metrics?.total_posts || 0) + 1,
    flagged_posts: (metrics?.flagged_posts || 0) + (flagged ? 1 : 0),
    updated_at: now.toISOString()
  };

  await supabase
    .from('post_metrics')
    .upsert(newMetrics);
}

// Post new content
export async function postContent(content: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { error: 'Unauthorized' };
  }

  // Check rate limit
  const isAllowed = await checkRateLimit(session.user.id);
  if (!isAllowed) {
    return { error: 'Rate limit exceeded' };
  }

  // Moderate content
  const moderationResult = await moderateContent(content);

  if (moderationResult.flagged) {
    return { error: 'Content flagged by moderation system' };
  }
  // Create post
  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      content,
      user_id: session.user.id,
      user_email: session.user.email,
      moderation_result: moderationResult,
    })
    .select()
    .single();

  if (error) {
    console.error('Error inserting post:', error);
    return { error: error.message };
  }

  // Update metrics
  await updateUserMetrics(session.user.id, moderationResult.flagged);

  // Notify admins if post is flagged
  if (moderationResult.flagged) {
    const { data: admins } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('email_notifications', true);

    if (admins && admins.length > 0) {
      const notifications = admins.map(admin => ({
        user_id: admin.user_id,
        type: 'moderation_flag',
        title: 'New Flagged Post',
        content: `Post by ${session.user.email} was flagged by moderation system`,
        post_id: post.id
      }));

      await supabase.from('notifications').insert(notifications);
    }
  }

  return post;
}

// Fetch posts
export async function fetchPosts() {
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching posts:', error);
    return { error: error.message };
  }

  return posts;
}

// Report a post
export async function reportPost(postId: string, reason: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { error: 'Unauthorized' };
  }

  const { data: report, error } = await supabase
    .from('post_reports')
    .insert({
      post_id: postId,
      reporter_id: session.user.id,
      reason
    })
    .select()
    .single();

  if (error) {
    console.error('Error reporting post:', error);
    return { error: error.message };
  }

  // Notify admins
  const { data: admins } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('email_notifications', true);

  if (admins && admins.length > 0) {
    const notifications = admins.map(admin => ({
      user_id: admin.user_id,
      type: 'post_report',
      title: 'New Post Report',
      content: `A post has been reported. Reason: ${reason}`,
      post_id: postId,
      report_id: report.id
    }));

    await supabase.from('notifications').insert(notifications);
  }

  return report;
}

// Fetch user's post history
export async function fetchUserPosts(userId: string) {
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user posts:', error);
    return { error: error.message };
  }

  return posts;
}

// Fetch user's post metrics
export async function fetchUserMetrics(userId: string) {
  const { data: metrics, error } = await supabase
    .from('post_metrics')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // Not found error
    console.error('Error fetching user metrics:', error);
    return { error: error.message };
  }

  return metrics || {
    user_id: userId,
    post_count_last_hour: 0,
    total_posts: 0,
    flagged_posts: 0
  };
}
