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

    const { postId, reason } = await request.json()

    if (!postId || !reason) {
      return NextResponse.json({ error: 'Post ID and reason are required' }, { status: 400 })
    }

    // Create report
    const { data: report, error: reportError } = await supabase
      .from('post_reports')
      .insert({
        post_id: postId,
        reporter_id: session.user.id,
        reason
      })
      .select()
      .single()

    if (reportError) {
      console.error('Error creating report:', reportError)
      return NextResponse.json({ error: reportError.message }, { status: 500 })
    }

    // Get admin users for notification
    const { data: adminUsers } = await supabase
      .from('admin_users')
      .select('user_id')

    if (adminUsers && adminUsers.length > 0) {
      // Send notifications to admin users
      const notifications = adminUsers.map(admin => ({
        user_id: admin.user_id,
        type: 'post_report',
        content: `New post report for post ${postId}`,
        post_id: postId,
        report_id: report.id
      }))

      await supabase.from('notifications').insert(notifications)
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('Error in POST /api/posts/report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
