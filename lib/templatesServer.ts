import { cache } from 'react'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import type { Category, Template, TemplateImage } from '@/types'

// 服务端数据读取（用于 SSR/ISR 页面）。
// 注意：这里返回的数据会被渲染进可缓存的 HTML，
// 因此绝不包含 template_url，也不生成有时效的 openUrl（sealUrl TTL 仅 10 分钟）。

export const getTemplatesPage = cache(async (page = 1, pageSize = 12): Promise<{ templates: Template[]; total: number }> => {
  const { data, error } = await supabaseAdmin.rpc('rpc_get_templates', {
    p_page: page,
    p_page_size: pageSize,
    p_search_q: null,
    p_category_ids: null,
  })

  if (error || !data) {
    console.error('[templatesServer] rpc_get_templates error:', error)
    return { templates: [], total: 0 }
  }

  const templates: Template[] = Array.isArray(data.templates)
    ? data.templates.map((t: any) => {
        const { template_url, ...rest } = t || {}
        return rest as Template
      })
    : []

  return { templates, total: Number(data.total ?? 0) }
})

export const getCategories = cache(async (): Promise<Category[]> => {
  const { data, error } = await supabaseAdmin
    .from('t_categories')
    .select('id,name,parent_id,sort_order')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('[templatesServer] categories error:', error)
    return []
  }
  return (data ?? []) as Category[]
})

export interface TemplateDetail {
  id: string
  title: string
  description: string
  cover_url: string | null
  price: number
  created_at: string
  images: TemplateImage[]
  downloads: number
  rating: number
  rating_count: number
}

export const getTemplateDetail = cache(async (id: string): Promise<TemplateDetail | null> => {
  const { data: template, error } = await supabaseAdmin
    .from('t_templates')
    .select('id, title, description, cover_url, thum_cover_url, price, created_at')
    .eq('id', id)
    .eq('status', 'published')
    .is('deleted_at', null)
    .single()

  if (error || !template) return null

  const [{ data: images }, { data: downloadData }, { data: ratingData }] = await Promise.all([
    supabaseAdmin
      .from('t_template_images')
      .select('id, template_id, image_url, sort_order, created_at')
      .eq('template_id', id)
      .order('sort_order', { ascending: true }),
    supabaseAdmin
      .from('t_template_downloads')
      .select('download_count')
      .eq('template_id', id)
      .maybeSingle(),
    supabaseAdmin
      .from('t_template_ratings')
      .select('average_rating, rating_count')
      .eq('template_id', id)
      .maybeSingle(),
  ])

  return {
    id: template.id,
    title: template.title,
    description: template.description ?? '',
    cover_url: template.cover_url ?? (template as any).thum_cover_url ?? null,
    price: Number(template.price ?? 0),
    created_at: template.created_at,
    images: (images ?? []) as TemplateImage[],
    downloads: downloadData?.download_count ?? 0,
    rating: ratingData?.average_rating ? parseFloat(String(ratingData.average_rating)) : 0,
    rating_count: ratingData?.rating_count ?? 0,
  }
})

export const getAllPublishedTemplates = cache(async (): Promise<Array<{ id: string; title: string; created_at: string }>> => {
  const { data, error } = await supabaseAdmin
    .from('t_templates')
    .select('id, title, created_at')
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(2000)

  if (error) {
    console.error('[templatesServer] all templates error:', error)
    return []
  }
  return data ?? []
})
