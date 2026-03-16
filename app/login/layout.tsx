import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '登录 - Notion模板市场',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 登录页面不显示 Header 和 Footer，直接渲染内容
  return <>{children}</>
}
