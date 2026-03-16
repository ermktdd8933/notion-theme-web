import { Star } from 'lucide-react'

interface StarRatingProps {
  rating: number // 评分值（0-5，可以是0.5的倍数）
  size?: 'sm' | 'md' | 'lg' // 星星大小
  showCount?: boolean // 是否显示评分数量
  count?: number // 评分数量
  className?: string // 额外的样式类
}

export default function StarRating({ 
  rating, 
  size = 'md', 
  showCount = false, 
  count,
  className = '' 
}: StarRatingProps) {
  // 如果没有评分，默认显示4.0
  const displayRating = rating ?? 4.0

  // 根据size设置星星大小
  const starSizeClass = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-5 h-5'
  }[size]

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {Array.from({ length: 5 }).map((_, index) => {
        const starBaseValue = index + 1
        const starMinValue = index + 0.5
        const isFilled = starBaseValue <= displayRating
        const isHalfFilled = displayRating >= starMinValue && displayRating < starBaseValue

        return (
          <div
            key={index}
            className="relative"
          >
            {/* 背景星星（灰色） */}
            <Star
              className={`${starSizeClass} text-gray-300`}
            />
            {/* 前景星星（黄色，根据评分显示） */}
            <div 
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{
                width: isFilled ? '100%' : isHalfFilled ? '50%' : '0%'
              }}
            >
              <Star
                className={`${starSizeClass} fill-yellow-400 text-yellow-400`}
              />
            </div>
          </div>
        )
      })}
      {showCount && (count ?? 0) > 0 && (
        <span className="text-xs text-gray-500 ml-1">({count})</span>
      )}
    </div>
  )
}
