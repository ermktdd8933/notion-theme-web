'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabaseClient } from '@/lib/supabaseClient'

type Row = {
  id: string
  title: string
  template_url: string
  status: 'draft' | 'pending_review' | 'published' | 'archived' | 'reject'
  created_at: string
  updated_at: string | null
}

const statusToCN: Record<Row['status'], string> = {
  draft: '草稿',
  pending_review: '待审核',
  published: '已发布',
  archived: '已归档',
  reject: '已拒绝'
}

export default function MySubmissionsPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { data: sessionData } = await supabaseClient.auth.getSession()
        const token = sessionData?.session?.access_token
        if (!token) {
          window.location.href = `/login?redirect=${encodeURIComponent('/submissions')}`
          return
        }
        const res = await fetch('/api/my/templates', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const json = await res.json()
        setRows(json.templates || [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">我的模板提交记录</h1>
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">标题</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">模板链接</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">状态</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">创建时间</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">修改时间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-500">加载中...</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-500">暂无提交记录</td>
              </tr>
            ) : (
              rows.map(row => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{row.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <a href={row.template_url} target="_blank" rel="noreferrer" className="text-gray-900 hover:underline">
                      {row.template_url}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 whitespace-nowrap">
                      {statusToCN[row.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{new Date(row.created_at).toLocaleString('zh-CN')}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{row.updated_at ? new Date(row.updated_at).toLocaleString('zh-CN') : '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}


