import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// 获取当前用户对模版的评分
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = params.id

    if (!templateId) {
      return NextResponse.json({ error: 'Missing template id' }, { status: 400 })
    }

    // 获取用户token
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization')
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : undefined

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userResp, error: userErr } = await supabaseAdmin.auth.getUser(token)
    if (userErr || !userResp?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 查询用户是否已评分
    const { data: userRating, error: ratingError } = await supabaseAdmin
      .from('t_user_template_ratings')
      .select('rating, created_at, updated_at')
      .eq('template_id', templateId)
      .eq('user_id', userResp.user.id)
      .single()

    if (ratingError && ratingError.code !== 'PGRST116') { // PGRST116 表示没有找到记录
      console.error('[API /api/templates/[id]/rating] GET error:', ratingError)
      return NextResponse.json({ error: 'Failed to get rating' }, { status: 500 })
    }

    return NextResponse.json({
      hasRated: !!userRating,
      rating: userRating?.rating || null,
      createdAt: userRating?.created_at || null,
      updatedAt: userRating?.updated_at || null
    })
  } catch (e: any) {
    console.error('[API /api/templates/[id]/rating] GET unexpected error:', e)
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 })
  }
}

// 提交模版评分
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = params.id

    if (!templateId) {
      return NextResponse.json({ error: 'Missing template id' }, { status: 400 })
    }

    // 获取用户token
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization')
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : undefined

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userResp, error: userErr } = await supabaseAdmin.auth.getUser(token)
    if (userErr || !userResp?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 解析请求体
    const body = await req.json()
    const rating = parseFloat(body.rating)

    // 验证评分
    if (!rating || isNaN(rating) || rating < 0.5 || rating > 5.0) {
      return NextResponse.json({ error: 'Invalid rating. Rating must be between 0.5 and 5.0' }, { status: 400 })
    }

    // 验证评分步长（必须是0.5的倍数）
    if (Math.round(rating * 2) !== rating * 2) {
      return NextResponse.json({ error: 'Invalid rating. Rating must be a multiple of 0.5' }, { status: 400 })
    }

    // 检查模版是否存在
    const { data: template, error: templateError } = await supabaseAdmin
      .from('t_templates')
      .select('id')
      .eq('id', templateId)
      .eq('status', 'published')
      .is('deleted_at', null)
      .single()

    if (templateError || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // 调用RPC函数提交评分
    const { data: result, error: rpcError } = await supabaseAdmin.rpc('submit_template_rating', {
      p_template_id: templateId,
      p_user_id: userResp.user.id,
      p_rating: rating
    })

    if (rpcError) {
      console.error('[API /api/templates/[id]/rating] POST RPC error:', rpcError)
      return NextResponse.json({ error: rpcError.message || 'Failed to submit rating' }, { status: 500 })
    }

    if (!result?.success) {
      return NextResponse.json({ error: result?.error || 'Failed to submit rating' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      rating: result.rating,
      average_rating: result.average_rating,
      rating_count: result.rating_count
    })
  } catch (e: any) {
    console.error('[API /api/templates/[id]/rating] POST unexpected error:', e)
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 })
  }
}
