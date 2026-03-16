import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// 记录模版下载次数
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = params.id

    if (!templateId) {
      return NextResponse.json({ error: 'Missing template id' }, { status: 400 })
    }

    // 验证模版是否存在
    const { data: template, error: templateError } = await supabaseAdmin
      .from('t_templates')
      .select('id')
      .eq('id', templateId)
      .is('deleted_at', null)
      .single()

    if (templateError || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // 使用 RPC 函数原子性地增加下载次数（如果不存在则创建，存在则+1）
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('increment_template_download', {
      p_template_id: templateId
    })

    if (rpcError) {
      console.error('[API /api/templates/[id]/download] RPC error:', rpcError)
      // 如果 RPC 不存在，使用备用方案：先查询，再更新或插入
      const { data: existing } = await supabaseAdmin
        .from('t_template_downloads')
        .select('download_count')
        .eq('template_id', templateId)
        .single()

      if (existing) {
        // 更新现有记录
        const { data: updated, error: updateError } = await supabaseAdmin
          .from('t_template_downloads')
          .update({ 
            download_count: existing.download_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('template_id', templateId)
          .select('download_count')
          .single()

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 500 })
        }
        return NextResponse.json({ 
          success: true,
          downloads: updated?.download_count || 0
        })
      } else {
        // 插入新记录
        const { data: inserted, error: insertError } = await supabaseAdmin
          .from('t_template_downloads')
          .insert({
            template_id: templateId,
            download_count: 1
          })
          .select('download_count')
          .single()

        if (insertError) {
          return NextResponse.json({ error: insertError.message }, { status: 500 })
        }
        return NextResponse.json({ 
          success: true,
          downloads: inserted?.download_count || 1
        })
      }
    }

    return NextResponse.json({ 
      success: true,
      downloads: rpcResult || 0
    })
  } catch (e: any) {
    console.error('[API /api/templates/[id]/download] unexpected error:', e)
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 })
  }
}
