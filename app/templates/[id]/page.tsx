import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import OpenTemplateButton from '@/components/OpenTemplateButton'
import { getTemplateDetail } from '@/lib/templatesServer'

export const revalidate = 3600

const SITE_URL = 'https://www.notiontheme.com'

interface PageProps {
  params: { id: string }
}

function truncate(text: string, max = 155): string {
  const clean = (text || '').replace(/\s+/g, ' ').trim()
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const template = await getTemplateDetail(params.id)
  if (!template) {
    return { title: '模板不存在 - Notion模板市场', robots: { index: false } }
  }

  const title = `${template.title} - 免费中文 Notion 模板下载`
  const description = truncate(
    template.description || `${template.title}，来自 Notion模板市场的中文 Notion 模板，一键复制到你的 Notion 工作区。`
  )

  return {
    title,
    description,
    alternates: { canonical: `/templates/${template.id}` },
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${SITE_URL}/templates/${template.id}`,
      siteName: 'Notion模板市场',
      locale: 'zh_CN',
      images: template.cover_url ? [{ url: template.cover_url, alt: template.title }] : undefined,
    },
  }
}

export default async function TemplatePage({ params }: PageProps) {
  const template = await getTemplateDetail(params.id)
  if (!template) notFound()

  const isFree = !template.price || template.price === 0

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        name: template.title,
        description: truncate(template.description, 500) || template.title,
        image: [template.cover_url, ...template.images.map(i => i.image_url)].filter(Boolean),
        url: `${SITE_URL}/templates/${template.id}`,
        brand: { '@type': 'Brand', name: 'Notion模板市场' },
        offers: {
          '@type': 'Offer',
          price: template.price ?? 0,
          priceCurrency: 'CNY',
          availability: 'https://schema.org/InStock',
          url: `${SITE_URL}/templates/${template.id}`,
        },
        ...(template.rating_count > 0
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: template.rating,
                ratingCount: template.rating_count,
                bestRating: 5,
                worstRating: 1,
              },
            }
          : {}),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: '模板库', item: `${SITE_URL}/templates` },
          { '@type': 'ListItem', position: 3, name: template.title },
        ],
      },
    ],
  }

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6" aria-label="面包屑">
          <Link href="/" className="hover:text-gray-900">首页</Link>
          <span className="mx-2">/</span>
          <Link href="/templates" className="hover:text-gray-900">模板库</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{template.title}</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">{template.title}</h1>

        <div className="flex items-center gap-3 mb-8">
          <Badge className="border-0 px-2 py-0.5 text-xs rounded bg-gray-900 text-white">
            {isFree ? 'Free 免费' : `￥${template.price}`}
          </Badge>
          <span className="text-sm text-gray-500">{template.downloads.toLocaleString()} 次下载</span>
          {template.rating_count > 0 && (
            <span className="text-sm text-gray-500">评分 {template.rating.toFixed(1)} / 5（{template.rating_count} 人）</span>
          )}
        </div>

        {template.cover_url && (
          <div className="rounded-xl overflow-hidden ring-1 ring-black/5 bg-gray-50 mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={template.cover_url}
              alt={`${template.title} - Notion 模板预览`}
              className="w-full object-contain"
            />
          </div>
        )}

        <div className="flex justify-center mb-10">
          <OpenTemplateButton templateId={template.id} price={template.price} />
        </div>

        {template.description && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">模板介绍</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">{template.description}</p>
          </section>
        )}

        {template.images.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">模板预览</h2>
            <div className="space-y-4">
              {template.images.map(img => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={img.id}
                  src={img.image_url}
                  alt={`${template.title} 预览图 ${img.sort_order + 1}`}
                  loading="lazy"
                  className="w-full rounded-xl ring-1 ring-black/5"
                />
              ))}
            </div>
          </section>
        )}

        <section className="border-t border-gray-100 pt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">如何使用这个 Notion 模板</h2>
          <ol className="list-decimal list-inside text-gray-600 leading-relaxed space-y-2">
            <li>点击上方「{isFree ? '免费获取模板' : '购买模板'}」按钮，跳转到 Notion 模板页面。</li>
            <li>在打开的 Notion 页面右上角点击「复制 / Duplicate」。</li>
            <li>模板会复制到你自己的 Notion 工作区，即可自由编辑使用。</li>
          </ol>
          <p className="text-gray-500 text-sm mt-6">
            更多免费中文 Notion 模板，请访问 <Link href="/" className="underline hover:text-gray-900">Notion模板市场首页</Link>。
          </p>
        </section>
      </div>
    </div>
  )
}
