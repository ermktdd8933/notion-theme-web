'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import SubmitTemplateModal from '@/components/SubmitTemplateModal'
import { useAuth } from '@/lib/authContext'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading, signOut } = useAuth()
  const [toolsOpen, setToolsOpen] = useState(false)
  const [kbOpen, setKbOpen] = useState(false)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const toolsRef = useRef<HTMLDivElement | null>(null)
  const kbRef = useRef<HTMLDivElement | null>(null)
  const userMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const clickInTools = toolsRef.current?.contains(target)
      const clickInKb = kbRef.current?.contains(target)
      const clickInUserMenu = userMenuRef.current?.contains(target)
      if (!clickInTools) setToolsOpen(false)
      if (!clickInKb) setKbOpen(false)
      if (!clickInUserMenu) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 当用户改变时，重置头像错误状态
  useEffect(() => {
    setAvatarError(false)
  }, [user?.id])

  const handleSignOut = async () => {
    await signOut()
    setUserMenuOpen(false)
    if (pathname !== '/') {
      router.push('/')
    }
  }

  const handleLogin = () => {
    const redirect = pathname !== '/login' ? pathname : '/'
    router.push(`/login?redirect=${encodeURIComponent(redirect)}`)
  }

  const getUserInitials = () => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name.charAt(0).toUpperCase()
    }
    return 'U'
  }

  const getUserAvatar = () => {
    return user?.user_metadata?.avatar_url || user?.user_metadata?.picture
  }

  const handleOpenSubmit = () => {
    if (!user) {
      const redirect = pathname || '/'
      router.push(`/login?redirect=${encodeURIComponent(redirect)}`)
      return
    }
    setSubmitOpen(true)
  }

  return (
    <header className="bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <a href="/" className="flex items-center">
              <img
                src="/notion-theme-logo-long.png"
                alt="NotionTheme"
                className="h-12 w-auto object-contain"
              />
            </a>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {/* Notion 工具下拉 */}
            <div className="relative" ref={toolsRef}>
              <button
                type="button"
                onClick={() => setToolsOpen((v) => !v)}
                className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors duration-200 flex items-center gap-1"
                aria-haspopup="menu"
                aria-expanded={toolsOpen}
              >
                <span>Notion 工具</span>
                <svg className={`w-4 h-4 transition-transform ${toolsOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                </svg>
              </button>
              {toolsOpen && (
                <div className="absolute right-0 mt-3 w-64 rounded-2xl bg-white shadow-[0_8px_32px_rgba(0,0,0,0.08)] ring-1 ring-black/5 overflow-hidden z-50">
                  <div className="py-1">
                    <a
                      href="https://templatestranslate.com"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between px-3.5 py-2.5 text-sm text-gray-800 hover:bg-gray-50 transition-colors"
                      onClick={() => setToolsOpen(false)}
                    >
                      <span className="font-medium">Notion 模版翻译</span>
                    </a>
                    <a
                      href="https://clipno.app"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between px-3.5 py-2.5 text-sm text-gray-800 hover:bg-gray-50 transition-colors"
                      onClick={() => setToolsOpen(false)}
                    >
                      <span className="font-medium">Notion 剪藏工具</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Notion 知识库下拉 */}
            <div className="relative" ref={kbRef}>
              <button
                type="button"
                onClick={() => setKbOpen((v) => !v)}
                className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors duration-200 flex items-center gap-1"
                aria-haspopup="menu"
                aria-expanded={kbOpen}
              >
                <span>Notion 知识库</span>
                <svg className={`w-4 h-4 transition-transform ${kbOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                </svg>
              </button>
              {kbOpen && (
                <div className="absolute right-0 mt-3 w-72 rounded-2xl bg-white shadow-[0_8px_32px_rgba(0,0,0,0.08)] ring-1 ring-black/5 overflow-hidden z-50">
                  <div className="py-1">
                    <a href="https://rednote.2notion.com" target="_blank" rel="noreferrer" className="block px-3.5 py-2.5 text-sm text-gray-800 hover:bg-gray-50" onClick={() => setKbOpen(false)}>【小红书】同步到 Notion</a>
                    <a href="https://flomo.2notion.com" target="_blank" rel="noreferrer" className="block px-3.5 py-2.5 text-sm text-gray-800 hover:bg-gray-50" onClick={() => setKbOpen(false)}>【flomo】同步到 Notion</a>
                    <a href="https://weread.2notion.com" target="_blank" rel="noreferrer" className="block px-3.5 py-2.5 text-sm text-gray-800 hover:bg-gray-50" onClick={() => setKbOpen(false)}>【微信读书】同步到 Notion</a>
                    <a href="https://bilibili.2notion.com" target="_blank" rel="noreferrer" className="block px-3.5 py-2.5 text-sm text-gray-800 hover:bg-gray-50" onClick={() => setKbOpen(false)}>【B站】同步到 Notion</a>
                    <a href="https://jike.2notion.com" target="_blank" rel="noreferrer" className="block px-3.5 py-2.5 text-sm text-gray-800 hover:bg-gray-50" onClick={() => setKbOpen(false)}>【即刻】同步到Notion</a>
                    <a href="https://xiaoyuzhou.2notion.com" target="_blank" rel="noreferrer" className="block px-3.5 py-2.5 text-sm text-gray-800 hover:bg-gray-50" onClick={() => setKbOpen(false)}>【小宇宙】同步到Notion</a>
                  </div>
                </div>
              )}
            </div>
            
            {/* Submit Template Button - 优化后的设计 */}
            <div className="relative">
              <Button 
                onClick={handleOpenSubmit}
                className="
                  bg-gradient-to-r from-gray-800 to-gray-900 
                  hover:from-gray-900 hover:to-black 
                  text-white font-semibold px-6 py-2.5 
                  rounded-xl shadow-lg hover:shadow-2xl 
                  transform hover:-translate-y-1 
                  transition-all duration-300 ease-out
                  border-0
                  text-sm
                  relative overflow-hidden
                "
              >
                <span className="relative z-10">提交模板</span>
                
                {/* 内部高光效果 */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              </Button>
              
              {/* 外部发光效果 */}
              <div className="absolute inset-0 bg-gradient-to-r from-gray-600/20 to-gray-800/20 rounded-xl blur-xl opacity-0 hover:opacity-100 transition-all duration-500 scale-110 hover:scale-125 pointer-events-none"></div>
            </div>

            {/* Login Button / User Avatar */}
            {!loading && (
              <>
                {user ? (
                  <div className="relative" ref={userMenuRef}>
                    <button
                      type="button"
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {getUserAvatar() && !avatarError ? (
                        <div className="relative w-8 h-8 rounded-full overflow-hidden">
                          {/* 使用普通 img 标签避免服务器端优化错误 */}
                          <img
                            src={getUserAvatar()}
                            alt={user.email || 'User'}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={() => setAvatarError(true)}
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-white text-sm font-medium">
                          {getUserInitials()}
                        </div>
                      )}
                    </button>
                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white shadow-[0_8px_32px_rgba(0,0,0,0.08)] ring-1 ring-black/5 overflow-hidden z-50">
                        <div className="py-1">
                          <div className="px-3.5 py-2.5 text-sm text-gray-800 border-b border-gray-100">
                            <div className="font-medium truncate">{user.email}</div>
                          </div>
                          <button
                            onClick={() => { setUserMenuOpen(false); router.push('/submissions') }}
                            className="w-full text-left px-3.5 py-2.5 text-sm text-gray-800 hover:bg-gray-50 transition-colors"
                          >
                            模版提交记录
                          </button>
                          <button
                            onClick={handleSignOut}
                            className="w-full text-left px-3.5 py-2.5 text-sm text-gray-800 hover:bg-gray-50 transition-colors"
                          >
                            退出登录
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Button
                    onClick={handleLogin}
                    variant="ghost"
                    className="text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    登录
                  </Button>
                )}
              </>
            )}
          </nav>
          <SubmitTemplateModal open={submitOpen} onOpenChange={setSubmitOpen} />

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm" className="p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
