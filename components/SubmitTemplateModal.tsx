'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { supabaseClient } from '@/lib/supabaseClient'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

type Category = {
  id: string
  name: string
  parent_id: string | null
  sort_order: number | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function SubmitTemplateModal({ open, onOpenChange }: Props) {
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [parentId, setParentId] = useState('')
  const [childId, setChildId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [templateUrl, setTemplateUrl] = useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverUrl, setCoverUrl] = useState('')
  const [thumCoverUrl, setThumCoverUrl] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    setSuccess('')
    void fetch('/api/categories')
      .then(r => r.json())
      .then((res) => {
        setCategories(res.categories || [])
      })
      .catch(() => setCategories([]))
  }, [open])

  const parents = useMemo(() => categories.filter(c => !c.parent_id), [categories])
  const children = useMemo(() => categories.filter(c => c.parent_id === parentId), [categories, parentId])

  useEffect(() => {
    if (parentId) {
      const firstChild = children[0]
      setChildId(firstChild ? firstChild.id : '')
    } else {
      setChildId('')
    }
  }, [parentId, children])

  /**
   * 使用 Canvas API 生成缩略图
   */
  const generateThumbnail = async (file: File, maxWidth: number = 800, quality: number = 0.9): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('无法创建 Canvas 上下文'))
        return
      }

      const objectUrl = URL.createObjectURL(file)
      
      img.onload = () => {
        // 计算新尺寸，保持宽高比
        let width = img.width
        let height = img.height
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        // 先用白色填充整个 canvas，避免透明背景转 JPEG 时变成黑色
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, width, height)

        // 绘制图片
        ctx.drawImage(img, 0, 0, width, height)

        // 转换为 Blob
        canvas.toBlob(
          (blob) => {
            // 清理对象 URL
            URL.revokeObjectURL(objectUrl)
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('生成缩略图失败'))
            }
          },
          'image/jpeg',
          quality
        )
      }

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('图片加载失败'))
      }
      
      img.src = objectUrl
    })
  }

  /**
   * 上传文件到 R2
   * @param file 要上传的文件
   * @param fileName 文件名
   * @param contentType 内容类型
   * @param isThumbnail 是否为缩略图（决定保存路径）
   */
  const uploadToR2 = async (file: File | Blob, fileName: string, contentType: string, isThumbnail: boolean = false): Promise<string> => {
    const res = await fetch('/api/uploads/r2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contentType, 
        fileName,
        isThumbnail // 传递是否为缩略图的标志
      })
    })
    if (!res.ok) throw new Error('获取上传地址失败')
    const data = await res.json()
    const putRes = await fetch(data.uploadUrl, { 
      method: 'PUT', 
      body: file, 
      headers: { 'Content-Type': contentType } 
    })
    if (!putRes.ok) throw new Error('上传失败')
    return data.publicUrl as string
  }

  /**
   * 上传封面和缩略图
   */
  const handleUpload = async (): Promise<{ coverUrl: string; thumCoverUrl: string }> => {
    if (!coverFile) throw new Error('没有选择封面文件')
    
    // 1. 上传原图
    const coverUrl = await uploadToR2(
      coverFile,
      coverFile.name,
      coverFile.type || 'image/jpeg',
      false // 不是缩略图
    )

    // 2. 生成并上传缩略图
    const thumbnailBlob = await generateThumbnail(coverFile, 800, 0.9)
    const thumbnailFileName = `thumb_${coverFile.name.replace(/\.[^/.]+$/, '')}.jpg`
    const thumCoverUrl = await uploadToR2(
      thumbnailBlob,
      thumbnailFileName,
      'image/jpeg',
      true // 是缩略图
    )

    return { coverUrl, thumCoverUrl }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    // 必填校验
    if (!parentId) {
      toast.error('请选择一级分类')
      return
    }
    if (!childId) {
      toast.error('请选择二级分类')
      return
    }
    if (!title.trim()) {
      toast.error('请填写模板名称')
      return
    }
    if (!description.trim()) {
      toast.error('请填写功能描述')
      return
    }
    if (!templateUrl.trim()) {
      toast.error('请填写模板地址')
      return
    }
    setLoading(true)
    try {
      let finalCoverUrl = coverUrl
      let finalThumCoverUrl = thumCoverUrl
      
      // 如果选择了新文件，上传原图和生成缩略图
      if (coverFile && !finalCoverUrl) {
        const { coverUrl: uploadedCoverUrl, thumCoverUrl: uploadedThumCoverUrl } = await handleUpload()
        finalCoverUrl = uploadedCoverUrl
        finalThumCoverUrl = uploadedThumCoverUrl
        setCoverUrl(finalCoverUrl)
        setThumCoverUrl(finalThumCoverUrl)
      }
      
      if (!finalCoverUrl) {
        toast.error('请上传封面图片')
        setLoading(false)
        return
      }

      // Attach Supabase access token for server to identify user
      const { data: sessionData } = await supabaseClient.auth.getSession()
      const accessToken = sessionData?.session?.access_token

      const resp = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          template_url: templateUrl.trim(),
          cover_url: finalCoverUrl,
          thum_cover_url: finalThumCoverUrl || '', // 如果没有缩略图，传空字符串
          category_id: childId
        })
      })
      if (!resp.ok) {
        const { error: errMsg } = await resp.json().catch(() => ({ error: '提交失败' }))
        throw new Error(errMsg || '提交失败')
      }
      toast.success('提交成功，等待审核')
      // reset minimal
      setTitle('')
      setDescription('')
      setTemplateUrl('')
      setCoverFile(null)
      setCoverUrl('')
      setThumCoverUrl('')
      setParentId('')
      setChildId('')
    } catch (err: any) {
      toast.error(err?.message || '提交失败')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={() => onOpenChange(false)} />
      <div className="relative w-full max-w-xl mx-4 rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">提交模板</h3>
          <button className="text-gray-500 hover:text-gray-700" onClick={() => onOpenChange(false)}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 pt-4 pb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">一级分类</label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              >
                <option value="">请选择</option>
                {parents.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">二级分类</label>
              <select
                value={childId}
                onChange={(e) => setChildId(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              >
                <option value="">请选择</option>
                {children.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">模板名称</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="请输入模板名称" />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">功能描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简要描述模板的功能"
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm h-24 resize-y focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-sm text-gray-700 mb-1">模板地址</label>
              <Input value={templateUrl} onChange={(e) => setTemplateUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">封面图片</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-gray-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-black"
              />
            </div>
          </div>

          {/* 使用 toast 提示，不再展示内联文本 */}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" className="text-gray-700" onClick={() => onOpenChange(false)}>取消</Button>
            <Button type="submit" disabled={loading} className="bg-gray-900 hover:bg-black text-white">
              {loading ? '提交中...' : '提交'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}


