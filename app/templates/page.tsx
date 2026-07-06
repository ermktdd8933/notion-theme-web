import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPublishedTemplates } from '@/lib/templatesServer'

export const revalidate = 86400

export const metadata: Metadata = {
  title: '模板库 - 全部中文 Notion 模板列表',
  description: '浏览 Notion模板市场收录的全部中文 Notion 模板，涵盖项目管理、笔记、习惯打卡、知识库、个人主页等场景，全部支持一键复制使用。',
  alternates: { canonical: '/templates' },
}

export default async function TemplatesIndexPage() {
  const templates = await getAllPublishedTemplates()

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Notion 模板库</h1>
        <p className="text-gray-600 mb-10">
          共收录 {templates.length} 个中文 Notion 模板，点击任意模板查看详情并一键复制到你的 Notion 工作区。
          也可以回到 <Link href="/" className="underline hover:text-gray-900">首页</Link> 按分类和关键词筛选浏览。
        </p>

        <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {templates.map(t => (
            <li key={t.id}>
              <Link
                href={`/templates/${t.id}`}
                prefetch={false}
                className="text-gray-700 hover:text-gray-900 hover:underline"
              >
                {t.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
