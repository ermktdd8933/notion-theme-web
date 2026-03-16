import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sealUrl } from '@/lib/token'

// 获取单个模版详情（包括图片列表）
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = params.id

    if (!templateId) {
      return NextResponse.json({ error: 'Missing template id' }, { status: 400 })
    }

    // 获取模版基本信息（只查询已发布的模版）
    const { data: template, error: templateError } = await supabaseAdmin
      .from('t_templates')
      .select('id, title, description, template_url, cover_url, price, pay_url, author_id, created_at')
      .eq('id', templateId)
      .eq('status', 'published')
      .is('deleted_at', null)
      .single()

    if (templateError || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // 获取模版图片列表（按sort_order排序）
    const { data: images, error: imagesError } = await supabaseAdmin
      .from('t_template_images')
      .select('id, template_id, image_url, sort_order, created_at')
      .eq('template_id', templateId)
      .order('sort_order', { ascending: true })

    if (imagesError) {
      console.error('[API /api/templates/[id]] images query error:', imagesError)
    }

    // 获取作者信息（如果有）
    let author = null
    if (template.author_id) {
      const { data: authorData, error: authorError } = await supabaseAdmin.auth.admin.getUserById(template.author_id)
      if (!authorError && authorData?.user) {
        author = {
          id: authorData.user.id,
          email: authorData.user.email,
          user_metadata: authorData.user.user_metadata
        }
      }
    }

    // 获取下载次数（从统计表读取）
    const { data: downloadData, error: downloadError } = await supabaseAdmin
      .from('t_template_downloads')
      .select('download_count')
      .eq('template_id', templateId)
      .single()

    if (downloadError && downloadError.code !== 'PGRST116') { // PGRST116 表示没有找到记录
      console.error('[API /api/templates/[id]] download count error:', downloadError)
    }

    // 获取评分信息（从评分表读取）
    const { data: ratingData, error: ratingError } = await supabaseAdmin
      .from('t_template_ratings')
      .select('average_rating, rating_count')
      .eq('template_id', templateId)
      .single()

    if (ratingError && ratingError.code !== 'PGRST116') { // PGRST116 表示没有找到记录
      console.error('[API /api/templates/[id]] rating error:', ratingError)
    }

    // 为安全，隐藏真实 template_url，返回受保护的 openUrl
    const openUrl = template.template_url ? `/api/go?t=${sealUrl(template.template_url)}` : null
    const { template_url, ...restTemplate } = template

    // 如果没有评分，默认显示4.0
    const rating = ratingData?.average_rating ? parseFloat(ratingData.average_rating.toString()) : 4.0

    return NextResponse.json({
      ...restTemplate,
      openUrl,
      images: images || [],
      author,
      downloads: downloadData?.download_count || 0,
      rating,
      rating_count: ratingData?.rating_count || 0
    })
  } catch (e: any) {
    console.error('[API /api/templates/[id]] unexpected error:', e)
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 })
  }
}
