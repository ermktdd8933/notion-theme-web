import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/lib/authContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Notion模板市场 - 中国最大的Notion模板站',
  description: '中国最大的Notion模板分享平台，为个人和企业提供高质量的模板解决方案，提升工作效率和组织能力。',
  keywords: 'Notion, 模板, 生产力, 项目管理, 笔记, 工作流, 中文',
  authors: [{ name: 'Notion模板市场团队' }],
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Notion模板市场',
    description: '中国最大的Notion模板集合',
    type: 'website',
    locale: 'zh_CN',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
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
