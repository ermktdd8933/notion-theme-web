'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface OpenTemplateButtonProps {
  templateId: string
  price?: number
}

// SSR 详情页的 CTA：openUrl 是带时效的加密链接（10 分钟过期），
// 不能渲染进可缓存的 HTML，必须在点击时实时获取
export default function OpenTemplateButton({ templateId, price = 0 }: OpenTemplateButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleOpen = async () => {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/templates/${templateId}`)
      if (!res.ok) return
      const data = await res.json()

      if (price > 0 && data.pay_url) {
        window.open(data.pay_url, '_blank')
        return
      }

      if (data.openUrl) {
        fetch(`/api/templates/${templateId}/download`, { method: 'POST' }).catch(() => {})
        window.open(data.openUrl, '_blank')
      }
    } catch (e) {
      console.error('Failed to open template:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleOpen}
      disabled={loading}
      size="lg"
      className="bg-gray-900 text-white hover:bg-gray-800 px-8"
    >
      {loading ? '打开中...' : price > 0 ? `购买模板 ￥${price}` : '免费获取模板'}
    </Button>
  )
}
