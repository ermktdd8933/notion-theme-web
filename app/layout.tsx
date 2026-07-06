import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/lib/authContext'

const inter = Inter({ subsets: ['latin'] })

const SITE_URL = 'https://www.notiontheme.com'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Notion模板市场 - 500+ 免费中文 Notion 模板与主题下载',
    template: '%s | Notion模板市场',
  },
  description: '中国最大的中文 Notion 模板分享平台，收录 500+ 免费 Notion 模板与 Notion 主题，覆盖项目管理、笔记、习惯打卡、知识库等场景，一键复制到你的 Notion 工作区。',
  keywords: 'Notion模板, Notion主题, Notion中文模板, Notion免费模板, 生产力, 项目管理, 笔记, 工作流',
  authors: [{ name: 'Notion模板市场团队' }],
  alternates: { canonical: '/' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Notion模板市场 - 500+ 免费中文 Notion 模板与主题下载',
    description: '中国最大的中文 Notion 模板分享平台，500+ 免费模板一键复制使用。',
    type: 'website',
    locale: 'zh_CN',
    url: SITE_URL,
    siteName: 'Notion模板市场',
    images: [{ url: '/notion-theme-logo-long.png', width: 1200, height: 630, alt: 'Notion模板市场' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Notion模板市场 - 中国最大的Notion模板站',
    description: '中国最大的Notion模板分享平台，高质量模板解决方案。',
    images: ['/notion-theme-logo-long.png'],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: 'Notion模板市场',
      url: 'https://www.notiontheme.com/',
      inLanguage: 'zh-CN',
      description: '中国最大的Notion模板分享平台，为个人和企业提供高质量的模板解决方案。',
    },
    {
      '@type': 'Organization',
      name: 'Notion模板市场',
      url: 'https://www.notiontheme.com/',
      logo: 'https://www.notiontheme.com/logo.png',
    },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
          <Toaster richColors position="top-center" />
        </AuthProvider>
      </body>
    </html>
  )
}
