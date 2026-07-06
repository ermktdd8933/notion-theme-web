import { Badge } from '@/components/ui/badge'
import HomeClient from '@/components/HomeClient'
import { getCategories, getTemplatesPage } from '@/lib/templatesServer'

// ISR：每小时重新生成，保证首屏模板列表进入 HTML（可被搜索引擎与 AI 爬虫抓取）
export const revalidate = 3600

const SITE_URL = 'https://www.notiontheme.com'

const faqs = [
  {
    q: '什么是 Notion 模板？',
    a: 'Notion 模板是预先搭建好的 Notion 页面或数据库结构，涵盖笔记、项目管理、习惯打卡、个人主页、知识库等场景。使用模板可以跳过从零搭建的过程，一键复制即可开始使用。',
  },
  {
    q: '如何使用这里的 Notion 模板？',
    a: '打开模板详情页，点击「获取模板」跳转到 Notion 页面，然后点击右上角的「复制 / Duplicate」按钮，模板就会复制到你自己的 Notion 工作区，可以自由修改。',
  },
  {
    q: '这些中文 Notion 模板是免费的吗？',
    a: '站内绝大多数模板都可以免费复制使用，模板卡片上会标注 Free；少数由创作者定价的付费模板会明确显示价格。',
  },
  {
    q: 'Notion 模板和 Notion 主题有什么区别？',
    a: 'Notion 本身不支持传统意义上的「主题换肤」，大家常说的 Notion 主题通常指风格化的页面模板（如极简、暗色、美式复古等排版风格）。本站的模板库同时覆盖功能型模板与风格化主题模板。',
  },
  {
    q: '我可以提交自己制作的 Notion 模板吗？',
    a: '可以。通过「提交模板」页面上传你的模板链接、封面和介绍，审核通过后就会展示在模板市场中，供所有用户浏览和复制。',
  },
]

export default async function Home() {
  const [{ templates, total }, categories] = await Promise.all([
    getTemplatesPage(1, 12),
    getCategories(),
  ])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ItemList',
        name: '最新中文 Notion 模板',
        numberOfItems: templates.length,
        itemListElement: templates.map((t, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: t.title,
          url: `${SITE_URL}/templates/${t.id}`,
        })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  }

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header Section */}
      <div className="bg-white py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Top Badge */}
          <Badge variant="secondary" className="mb-4 text-sm px-3 py-1 bg-gray-100 text-gray-700 border-0">
            ✨ 欢迎提交你的Notion模板
          </Badge>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            超过{total > 0 ? total : 500}+的中文Notion免费模版
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            中国最大的 Notion 模板市场，覆盖 Notion 主题、笔记、项目管理、习惯打卡、知识库等场景，全部支持一键复制到你的工作区
          </p>
        </div>
      </div>

      <HomeClient
        initialTemplates={templates}
        initialTotal={total}
        initialCategories={categories}
      />

      {/* SEO / GEO 内容区：服务端渲染的站点介绍与常见问题 */}
      <section className="border-t border-gray-100 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            中文 Notion 模板与 Notion 主题下载站
          </h2>
          <div className="text-gray-600 leading-relaxed space-y-3 mb-12">
            <p>
              Notion模板市场（NotionTheme）是面向中文用户的 Notion 模板聚合平台，收录了 {total > 0 ? total : 500}+ 个免费与付费的中文 Notion 模板，
              涵盖项目管理、任务清单、读书笔记、习惯打卡、个人 OKR、知识库、简历、账本等常见场景，
              也包括极简、暗色等风格化的 Notion 主题模板。
            </p>
            <p>
              每个模板都提供预览图和详细介绍，点击「获取模板」即可跳转 Notion 一键复制（Duplicate）到自己的工作区，无需安装任何插件。
              如果你是模板创作者，也欢迎通过提交入口分享你的作品。
            </p>
            <p>
              搭建好模板之后，推荐搭配我们的网页剪藏工具{' '}
              <a href="https://clipno.app" target="_blank" rel="noreferrer" className="underline hover:text-gray-900">Clipno</a>{' '}
              使用：浏览网页时一键把文章、灵感保存进 Notion，让模板里的知识库和收集箱真正运转起来。
            </p>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">常见问题</h2>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <details
                key={f.q}
                open={i === 0}
                className="group rounded-xl border border-gray-200 bg-white px-5 py-4"
              >
                <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden flex items-center justify-between gap-4">
                  <h3 className="text-base font-semibold text-gray-900">{f.q}</h3>
                  <svg
                    className="w-4 h-4 shrink-0 text-gray-400 transition-transform group-open:rotate-180"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                  </svg>
                </summary>
                <p className="text-gray-600 leading-relaxed mt-3">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
