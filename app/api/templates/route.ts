import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sealUrl } from '@/lib/token'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const pageSize = Math.max(1, Math.min(60, parseInt(searchParams.get('pageSize') || '12', 10)))
    const q = (searchParams.get('q') || '').trim()
    const categoryId = (searchParams.get('categoryId') || '').trim()
    const isParent = searchParams.get('isParent') === 'true'

    // 确定目标分类ID数组
    let targetCatIds: string[] | null = null
    if (categoryId && categoryId !== 'all') {
      if (isParent) {
        // 如果是父类，先查询所有子类id
        const { data: childCats, error: childErr } = await supabaseAdmin
          .from('t_categories')
          .select('id')
          .eq('parent_id', categoryId)

        if (childErr) {
          console.error('[API /api/templates] category children query error:', childErr)
          return NextResponse.json({ templates: [], page, pageSize, total: 0 })
        } else if (childCats && childCats.length > 0) {
          targetCatIds = childCats.map(c => c.id)
        } else {
          return NextResponse.json({ templates: [], page, pageSize, total: 0 })
        }
      } else {
        targetCatIds = [categoryId]
      }
    }

    // 调用 RPC 函数：简单直接的 JOIN 查询
    const { data: result, error: rpcError } = await supabaseAdmin.rpc('rpc_get_templates', {
      p_page: page,
      p_page_size: pageSize,
      p_search_q: q || null,
      p_category_ids: targetCatIds
    })

    if (rpcError) {
      console.error('[API /api/templates] RPC call error:', rpcError)
      return NextResponse.json({ error: rpcError.message }, { status: 500 })
    }

    // 为安全，隐藏真实 template_url，返回受保护的 openUrl
    const safe = result || { templates: [], page, pageSize, total: 0 }
    const mapped = Array.isArray(safe.templates)
      ? safe.templates.map((t: any) => {
          const openUrl = t?.template_url ? `/api/go?t=${sealUrl(t.template_url)}` : null
          const { template_url, ...rest } = t || {}
          return { ...rest, openUrl }
        })
      : []
    return NextResponse.json({ ...safe, templates: mapped })
  } catch (e: any) {
    console.error('[API /api/templates] unexpected error:', e)
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // Require auth: extract JWT from Authorization header
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

    const body = await req.json()
    const title = (body.title || '').trim()
    const description = (body.description || '').trim()
    const templateUrl = (body.template_url || '').trim()
    const coverUrl = (body.cover_url || '').trim()
    const thumCoverUrl = (body.thum_cover_url || '').trim()
    const categoryId = (body.category_id || '').trim()

    if (!title || !templateUrl || !coverUrl || !categoryId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1) 创建模板，状态为 pending_review
    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from('t_templates')
      .insert({
        title,
        description,
        template_url: templateUrl,
        cover_url: coverUrl,
        thum_cover_url: thumCoverUrl || null, // 如果有缩略图就保存，没有就为 null
        status: 'pending_review',
        author_id: userResp.user.id
      })
      .select('id')
      .single()

    if (insertErr || !inserted) {
      return NextResponse.json({ error: insertErr?.message || 'Insert failed' }, { status: 500 })
    }

    // 2) 关联分类（选择子分类）
    const { error: relErr } = await supabaseAdmin
      .from('t_template_categories')
      .insert({ template_id: inserted.id, category_id: categoryId })

    if (relErr) {
      return NextResponse.json({ error: relErr.message }, { status: 500 })
    }

    return NextResponse.json({ id: inserted.id })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 })
  }
}
