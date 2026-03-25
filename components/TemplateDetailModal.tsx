'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Template, TemplateImage } from '@/types'
import { useAuth } from '@/lib/authContext'
import { useRouter, usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, X, Download, User } from 'lucide-react'
import Image from 'next/image'
import { supabaseClient } from '@/lib/supabaseClient'
import StarRating from '@/components/StarRating'
import InteractiveStarRating from '@/components/InteractiveStarRating'

type Props = {
  open: boolean
  templateId: string | null
  onOpenChange: (open: boolean) => void
}

export default function TemplateDetailModal({ open, templateId, onOpenChange }: Props) {
  const { user, session } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const [template, setTemplate] = useState<Template | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [avatarError, setAvatarError] = useState(false)
  const [userRating, setUserRating] = useState<number | null>(null)
  const [hasRated, setHasRated] = useState(false)
  const [submittingRating, setSubmittingRating] = useState(false)

  // 获取所有图片（主图 + 其他图片）
  const allImages: string[] = template
    ? [
        template.cover_url || '',
        ...(template.images || []).map((img: TemplateImage) => img.image_url)
      ].filter(Boolean)
    : []

  // 当模板或作者改变时，重置头像错误状态
  useEffect(() => {
    setAvatarError(false)
  }, [template?.author?.id, template?.id])

  useEffect(() => {
    if (!open || !templateId) {
      setTemplate(null)
      setCurrentImageIndex(0)
      setAvatarError(false)
      setUserRating(null)
      setHasRated(false)
      return
    }

    const fetchTemplate = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/templates/${templateId}`)
        if (!res.ok) {
          throw new Error('获取模版详情失败')
        }
        const data = await res.json()
        setTemplate(data)
        setCurrentImageIndex(0)

        // 如果用户已登录，获取用户的评分信息
        if (user && session?.access_token) {
          try {
            const ratingRes = await fetch(`/api/templates/${templateId}/rating`, {
              headers: {
                'Authorization': `Bearer ${session.access_token}`
              }
            })
            if (ratingRes.ok) {
              const ratingData = await ratingRes.json()
              if (ratingData.hasRated) {
                setUserRating(ratingData.rating)
                setHasRated(true)
              }
            }
          } catch (error) {
            console.error('Failed to fetch user rating:', error)
          }
        }
      } catch (error: any) {
        toast.error(error?.message || '获取模版详情失败')
        onOpenChange(false)
      } finally {
        setLoading(false)
      }
    }

    fetchTemplate()
  }, [open, templateId, onOpenChange, user, session])

  const handleDownload = async () => {
    if (!template) return

    const priceValue = Number(template.price ?? 0)
    const isFree = !priceValue || priceValue === 0

    // 记录下载次数
    try {
      await fetch(`/api/templates/${template.id}/download`, {
        method: 'POST'
      })
    } catch (error) {
      console.error('Failed to record download:', error)
    }

    // 本地点击计数：总点击次数
    const TOTAL_KEY = 'nt_click_total'
    const total = parseInt(localStorage.getItem(TOTAL_KEY) || '0', 10) + 1
    localStorage.setItem(TOTAL_KEY, String(total))

    // 模板级计数
    const perKey = `nt_click_${template.id}`
    const per = parseInt(localStorage.getItem(perKey) || '0', 10) + 1
    localStorage.setItem(perKey, String(per))

    // 超过 5 次且未登录，先去登录
    if (!user && total > 5) {
      toast.info('继续访问前请先登录')
      router.push(`/login?redirect=${encodeURIComponent(pathname || '/')}`)
      return
    }

    // 根据免费/付费跳转
    if (isFree) {
      // 免费模版：跳转到模版链接
      const url = template.openUrl || template.template_url
      if (url) {
        window.open(url, '_blank')
      }
    } else {
      // 付费模版：跳转到pay_url
      const payUrl = template.pay_url
      if (payUrl) {
        window.open(payUrl, '_blank')
      } else {
        toast.error('该模版暂无购买链接')
      }
    }

    // 更新下载次数显示
    if (template) {
      setTemplate({
        ...template,
        downloads: (template.downloads || 0) + 1
      })
    }
  }

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1))
  }

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0))
  }

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index)
  }

  const handleRatingChange = async (rating: number) => {
    if (!user || !session?.access_token || !templateId) {
      toast.error('请先登录')
      router.push(`/login?redirect=${encodeURIComponent(pathname || '/')}`)
      return
    }

    if (hasRated) {
      toast.info('您已经评分过了')
      return
    }

    if (submittingRating) {
      return
    }

    setSubmittingRating(true)
    try {
      const res = await fetch(`/api/templates/${templateId}/rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ rating })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || '提交评分失败')
      }

      const data = await res.json()
      setUserRating(rating)
      setHasRated(true)
      
      // 更新模版的评分信息
      if (template) {
        setTemplate({
          ...template,
          rating: data.average_rating,
          rating_count: data.rating_count
        })
      }

      toast.success('评分提交成功！')
    } catch (error: any) {
      toast.error(error?.message || '提交评分失败')
    } finally {
      setSubmittingRating(false)
    }
  }

  if (!open) return null

  const priceValue = Number(template?.price ?? 0)
  const isFree = !priceValue || priceValue === 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={() => onOpenChange(false)} 
      />
      
      {/* 弹窗内容 */}
      <div className="relative w-full max-w-5xl mx-4 max-h-[90vh] rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden flex flex-col">
        {/* 关闭按钮 */}
        <button
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
          onClick={() => onOpenChange(false)}
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-gray-500">加载中...</div>
          </div>
        ) : !template ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-gray-500">模版不存在</div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row overflow-hidden">
            {/* 左侧：图片区域 */}
            <div className="lg:w-1/2 bg-gray-50 p-6 flex flex-col min-h-[500px] lg:min-h-[600px]">
              {/* 主图展示区 */}
              <div className="relative flex-1 min-h-[400px] lg:min-h-[500px] rounded-xl overflow-hidden bg-white ring-1 ring-black/5 mb-4">
                {allImages.length > 0 ? (
                  <>
                    <Image
                      src={allImages[currentImageIndex]}
                      alt={template.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-contain object-center"
                      priority
                      unoptimized
                      style={{ maxWidth: '100%', maxHeight: '100%' }}
                    />
                    {/* 左右切换按钮 */}
                    {allImages.length > 1 && (
                      <>
                        <button
                          onClick={handlePreviousImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={handleNextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        {/* 图片指示器 */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                          {allImages.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => handleImageClick(index)}
                              className={`w-2 h-2 rounded-full transition-all ${
                                index === currentImageIndex
                                  ? 'bg-white w-6'
                                  : 'bg-white/50 hover:bg-white/75'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    暂无图片
                  </div>
                )}
              </div>

              {/* 缩略图列表 */}
              {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {allImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => handleImageClick(index)}
                      className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden ring-2 transition-all ${
                        index === currentImageIndex
                          ? 'ring-gray-900'
                          : 'ring-transparent hover:ring-gray-300'
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`${template.title} - 图片 ${index + 1}`}
                        fill
                        sizes="80px"
                        className="object-cover"
                        loading="lazy"
                        unoptimized
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 右侧：详情信息 */}
            <div className="lg:w-1/2 p-6 overflow-y-auto">
              <div className="space-y-6">
                {/* 标题 */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {template.title}
                  </h2>
                </div>

                {/* 作者信息 */}
                {template.author && (
                  <div className="flex items-center gap-3">
                    {template.author.user_metadata?.avatar_url && !avatarError ? (
                      <div className="relative w-10 h-10 rounded-full overflow-hidden">
                        {/* 使用普通 img 标签避免服务器端优化错误 */}
                        <img
                          src={template.author.user_metadata.avatar_url}
                          alt={template.author.email || 'Author'}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={() => setAvatarError(true)}
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-white text-sm font-medium">
                        {template.author.email?.charAt(0).toUpperCase() || <User className="w-5 h-5" />}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {template.author.user_metadata?.full_name || template.author.email || '未知作者'}
                      </div>
                      {template.author.email && (
                        <div className="text-xs text-gray-500">{template.author.email}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* 描述 */}
                {template.description && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">模版描述</h3>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {template.description}
                    </p>
                  </div>
                )}

                {/* 价格和下载次数 */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">下载次数</div>
                      <div className="text-sm font-medium text-gray-900">
                        {template.downloads?.toLocaleString() || 0} 次
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">评分</div>
                      <StarRating 
                        rating={template.rating ?? 4.0} 
                        size="md"
                        showCount={true}
                        count={template.rating_count}
                      />
                    </div>
                  </div>
                  <Badge className={`border-0 px-3 py-1 text-sm rounded ${isFree ? 'bg-black text-white' : 'bg-gray-900 text-white'}`}>
                    {isFree ? '免费' : `￥${priceValue}`}
                  </Badge>
                </div>

                {/* 评分区域 */}
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">评分</h3>
                  {!user ? (
                    <div className="text-sm text-gray-600 mb-3">
                      请先登录后才能评分
                    </div>
                  ) : hasRated ? (
                    <div className="flex items-center gap-2 mb-3">
                      <StarRating 
                        rating={userRating ?? 0} 
                        size="lg"
                      />
                      <span className="text-sm text-gray-600">您已评分：{userRating} 分</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <InteractiveStarRating
                        currentRating={0}
                        onRatingChange={handleRatingChange}
                        disabled={submittingRating}
                        size="lg"
                      />
                      {submittingRating && (
                        <div className="text-xs text-gray-500">提交中...</div>
                      )}
                    </div>
                  )}
                </div>

                {/* 下载按钮 */}
                <div className="pt-4">
                  <Button
                    onClick={handleDownload}
                    className="w-full bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    {isFree ? '免费下载' : '立即购买'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
