import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Template } from '@/types'
import Image from 'next/image'
import Link from 'next/link'
import StarRating from '@/components/StarRating'

interface TemplateCardProps {
  template: Template
  onClick?: (templateId: string) => void
}

export default function TemplateCard({ template, onClick }: TemplateCardProps) {
  // 卡片是真实链接（/templates/[id]），保证搜索引擎可抓取；
  // 普通点击仍拦截为弹窗交互，新标签/爬虫则进入详情页
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault()
      onClick(template.id)
    }
  }
  const priceValue = Number(template.price ?? 0)
  const isFree = !priceValue || priceValue === 0

  return (
    <Link href={`/templates/${template.id}`} prefetch={false} onClick={handleClick} className="block">
    <Card
      className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 bg-white overflow-hidden cursor-pointer"
    >
      <CardContent className="p-5">
        {/* Image Section - 灰色占满卡片上方（卡片内部） */}
        <div className="relative -mx-5 -mt-5 mb-5 bg-gray-100 pt-6 px-6 pb-2 rounded-t-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
          <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden ring-1 ring-black/5 bg-white">
            <Image
              src={template.cover_url || template.coverImage || 'https://file.notion.so/f/f/d01f9e1b-37be-4e62-ba09-3e4835a67760/69c56ed3-d5bb-40f0-8ad1-7300e4d20bd0/image.png?table=block&id=23a73415-a279-8092-a553-e50eab75d696&spaceId=d01f9e1b-37be-4e62-ba09-3e4835a67760&expirationTimestamp=1756303200000&signature=hehVsiY6qKJCW9XbbroHPwpMuGTfIfFx9ovrxOKfCYQ&downloadName=image.png'}
              alt={template.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-contain object-center transition-transform duration-300 group-hover:scale-[1.01] bg-white"
              loading="lazy"
              unoptimized
            />
          </div>
        </div>

        {/* 标题显示在图片下面 */}
        <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
          {template.title}
        </h3>

        {/* 底部信息栏 */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium">
            {template.downloads.toLocaleString()} 次下载
          </span>
          <div className="flex items-center space-x-2">
            <Badge className={`border-0 px-2 py-0.5 text-[10px] rounded ${isFree ? 'bg-black text-white' : 'bg-gray-900 text-white'}`}>
              {isFree ? 'Free' : `￥${priceValue}`}
            </Badge>
            <StarRating 
              rating={template.rating ?? 4.0} 
              size="sm"
            />
          </div>
        </div>
      </CardContent>
    </Card>
    </Link>
  )
}
