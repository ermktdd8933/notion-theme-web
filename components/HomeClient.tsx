'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import TemplateCard from '@/components/TemplateCard'
import TemplateDetailModal from '@/components/TemplateDetailModal'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Category, Template } from '@/types'
import { supabaseClient } from '@/lib/supabaseClient'

interface HomeClientProps {
  initialTemplates: Template[]
  initialTotal: number
  initialCategories: Category[]
}

export default function HomeClient({ initialTemplates, initialTotal, initialCategories }: HomeClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [templates, setTemplates] = useState<Template[]>(initialTemplates)
  const [total, setTotal] = useState(initialTotal)
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const templatesPerPage = 12
  const [selectedParentId, setSelectedParentId] = useState<string>('all')
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const isFirstRun = useRef(true)

  useEffect(() => {
    // 首屏数据已由服务端渲染注入，跳过首次客户端请求
    if (isFirstRun.current) {
      isFirstRun.current = false
      if (initialTemplates.length > 0) return
    }

    const fetchData = async () => {
      try {
        // 获取用户 session token（可选，未登录也可以查看模板）
        const { data: { session } } = await supabaseClient.auth.getSession()
        const token = session?.access_token

        const params = new URLSearchParams({
          page: String(currentPage),
          pageSize: String(templatesPerPage),
        })
        // pass server-side filters
        if (searchQuery.trim()) params.set('q', searchQuery.trim())
        // Category filtering: child sends childId directly; parent sends parentId + isParent flag
        if (selectedChildId) {
          params.set('categoryId', selectedChildId)
        } else if (selectedParentId && selectedParentId !== 'all') {
          params.set('categoryId', selectedParentId)
          params.set('isParent', 'true')
        }

        // 构建请求头，如果有 token 就带上，没有就不带
        const headers: HeadersInit = {}
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }

        const [tplRes, catRes] = await Promise.all([
          fetch(`/api/templates?${params.toString()}`, {
            headers
          }),
          fetch('/api/categories')
        ])

        // 检查模板 API 响应
        if (!tplRes.ok) {
          const errorData = await tplRes.json()
          console.error('Failed to fetch templates:', errorData)
          setTemplates([])
          setTotal(0)
          return
        }

        const tplJson = await tplRes.json()
        const catJson = await catRes.json()
        setTemplates(tplJson.templates ?? [])
        setTotal(tplJson.total ?? 0)
        setCategories(catJson.categories ?? [])
      } catch (e) {
        console.error('Failed to fetch data', e)
        setTemplates([])
        setTotal(0)
      }
    }
    fetchData()
  }, [currentPage, searchQuery, selectedParentId, selectedChildId])

  // Derive parent/children lists
  const parentCategories = useMemo(() => (categories ?? []).filter(c => !c.parent_id), [categories])
  const allChildren = useMemo(() => (categories ?? []).filter(c => !!c.parent_id), [categories])
  const visibleChildren = useMemo(() => {
    if (selectedParentId === 'all') return allChildren
    return allChildren.filter(c => c.parent_id === selectedParentId)
  }, [allChildren, selectedParentId])

  // Filter templates based on search and category selection
  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = searchQuery === '' ||
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (template.description ?? '').toLowerCase().includes(searchQuery.toLowerCase())

      let matchesCategory = true
      if (selectedChildId) {
        matchesCategory = (template.categoryIds ?? []).includes(selectedChildId)
      } else if (selectedParentId !== 'all') {
        const childIds = allChildren.filter(c => c.parent_id === selectedParentId).map(c => c.id)
        const setIds = new Set(template.categoryIds ?? [])
        matchesCategory = childIds.some(id => setIds.has(id))
      }

      return matchesSearch && matchesCategory
    })
  }, [searchQuery, selectedParentId, selectedChildId, templates, allChildren])

  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil((total || 0) / templatesPerPage))
  const currentTemplates = filteredTemplates

  // Reset to first page when filters change
  const handleSelectParent = (parentId: string) => {
    setSelectedParentId(parentId)
    setSelectedChildId(null)
    setSelectedCategory(parentId)
    setCurrentPage(1)
  }

  const handleSelectChild = (childId: string) => {
    setSelectedChildId(childId)
    setSelectedCategory(childId)
    setCurrentPage(1)
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  const topLevelCategories = useMemo(() => {
    return [{ id: 'all', name: '全部' } as any].concat(parentCategories)
  }, [parentCategories])

  return (
    <>
      {/* Search Section */}
      <div className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="搜索模板..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-4 py-3 text-base bg-white border-gray-300"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Section */}
      <div className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* First Row - Parents */}
          <div className="flex flex-wrap gap-2 justify-center mb-2">
            {topLevelCategories.slice(0, 9).map((category: any) => (
              <Button
                key={category.id}
                variant={selectedParentId === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleSelectParent(category.id)}
                className={`px-4 py-2 ${
                  selectedParentId === category.id
                    ? 'bg-gray-900 text-white hover:bg-gray-800'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {category.name}
              </Button>
            ))}
          </div>

          {/* Second Row - Children: default show all children; when a parent is selected, show only its children */}
          <div className="flex flex-wrap gap-2 justify-center ml-8">
            {(selectedParentId === 'all' ? allChildren : visibleChildren).map((category: any) => (
              <Button
                key={category.id}
                variant={selectedChildId === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleSelectChild(category.id)}
                className={`px-4 py-2 ${
                  selectedChildId === category.id
                    ? 'bg-gray-900 text-white hover:bg-gray-800'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Templates Section */}
      <div className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Results Count */}
          <div className="mb-6">
            <p className="text-gray-600">
              显示 {(currentPage - 1) * templatesPerPage + 1}-{Math.min(currentPage * templatesPerPage, total)} 个，共 {total} 个模板
            </p>
          </div>

          {/* Templates Grid */}
          {currentTemplates.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
              {currentTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onClick={(templateId) => {
                    setSelectedTemplateId(templateId)
                    setDetailModalOpen(true)
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <Search className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                没有找到匹配的模板
              </h3>
              <p className="text-gray-600">
                请尝试调整搜索关键词或分类筛选
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-4">
              {/* Previous Button */}
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`text-sm ${
                  currentPage === 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                &lt; 上一页
              </button>

              {/* Page Numbers */}
              <div className="flex items-center space-x-2">
                {/* First page */}
                <button
                  onClick={() => setCurrentPage(1)}
                  className={`px-3 py-1 rounded-md text-sm ${
                    currentPage === 1
                      ? 'border border-blue-300 bg-gray-50 text-black'
                      : 'text-black hover:text-gray-600'
                  }`}
                >
                  1
                </button>

                {/* Show pages around current page */}
                {currentPage > 3 && (
                  <span className="text-black">...</span>
                )}

                {/* Middle pages */}
                {Array.from({ length: Math.min(3, totalPages - 2) }, (_, i) => {
                  let pageNum
                  if (currentPage <= 3) {
                    pageNum = i + 2
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 3 + i
                  } else {
                    pageNum = currentPage - 1 + i
                  }

                  if (pageNum > 1 && pageNum < totalPages) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded-md text-sm ${
                          currentPage === pageNum
                            ? 'border border-blue-300 bg-gray-50 text-black'
                            : 'text-black hover:text-gray-600'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  }
                  return null
                })}

                {/* Show ellipsis before last page if needed */}
                {currentPage < totalPages - 2 && totalPages > 4 && (
                  <span className="text-black">...</span>
                )}

                {/* Last page (if not first page) */}
                {totalPages > 1 && (
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className={`px-3 py-1 rounded-md text-sm ${
                      currentPage === totalPages
                        ? 'border border-blue-300 bg-gray-50 text-black'
                        : 'text-black hover:text-gray-600'
                    }`}
                  >
                    {totalPages}
                  </button>
                )}
              </div>

              {/* Next Button */}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`text-sm ${
                  currentPage === totalPages
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-black hover:text-gray-600'
                }`}
              >
                下一页 &gt;
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 模版详情弹窗 */}
      <TemplateDetailModal
        open={detailModalOpen}
        templateId={selectedTemplateId}
        onOpenChange={setDetailModalOpen}
      />
    </>
  )
}
