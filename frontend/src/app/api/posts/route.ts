import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content } = await request.json()

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Check rate limit
    const now = new Date()
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    const { data: metrics, error: metricsError } = await supabase
      .from('post_metrics')
      .select()
      .eq('user_id', session.user.id)
      .single()

    if (metricsError && metricsError.code !== 'PGRST116') { // Not found error
      console.error('Error checking rate limit:', metricsError)
      return NextResponse.json({ error: metricsError.message }, { status: 500 })
    }

    const postCount = metrics?.post_count_last_hour || 0
    const lastPostTime = metrics?.last_post_time ? new Date(metrics.last_post_time) : null

    if (postCount >= 10) { // Max 10 posts per hour
      if (lastPostTime && lastPostTime > hourAgo) {
        return NextResponse.json({ 
          error: 'Rate limit exceeded',
          resetTime: new Date(lastPostTime.getTime() + 60 * 60 * 1000)
        }, { status: 429 })
      }
    }

    // Check content moderation with backend
    const moderationResponse = await fetch('http://localhost:3001/api/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: content })
    })

    if (!moderationResponse.ok) {
      const error = await moderationResponse.json()
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const moderationResult = await moderationResponse.json()

    // Insert post with moderation results
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        content,
        user_id: session.user.id,
        user_email: session.user.email,
        is_flagged: moderationResult.flagged,
        moderation_status: moderationResult.flagged ? 'rejected' : 'approved',
        moderation_reason: moderationResult.reason,
        moderation_score: moderationResult.confidence
      })
      .select()
      .single()

    if (postError) {
      console.error('Error inserting post:', postError)
      return NextResponse.json({ error: postError.message }, { status: 500 })
    }

    // Update post metrics
    const { error: updateError } = await supabase
      .from('post_metrics')
      .upsert({
        user_id: session.user.id,
        post_count_last_hour: lastPostTime && lastPostTime > hourAgo ? postCount + 1 : 1,
        last_post_time: now.toISOString(),
        total_posts: (metrics?.total_posts || 0) + 1,
        flagged_posts: metrics?.flagged_posts || 0 + (moderationResult.flagged ? 1 : 0),
        updated_at: now.toISOString()
      })

    if (updateError) {
      console.error('Error updating metrics:', updateError)
    }

    // If post is flagged, create notification for admins
    if (moderationResult.flagged) {
      const { data: admins } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('email_notifications', true)

      if (admins && admins.length > 0) {
        const notifications = admins.map(admin => ({
          user_id: admin.user_id,
          type: 'moderation_flag',
          title: 'New Flagged Post',
          content: `Post by ${session.user.email} was flagged by moderation system`,
          post_id: post.id
        }))

        await supabase.from('notifications').insert(notifications)
      }
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error in POST /api/posts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .eq('moderation_status', 'approved')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching posts:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(posts)
  } catch (error) {
    console.error('Error in GET /api/posts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
