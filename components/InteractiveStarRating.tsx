'use client'

import { Star } from 'lucide-react'
import { useState, useRef } from 'react'

interface InteractiveStarRatingProps {
  currentRating?: number // 当前评分（如果已评分）
  onRatingChange: (rating: number) => void // 评分变化回调
  disabled?: boolean // 是否禁用
  size?: 'sm' | 'md' | 'lg' // 星星大小
}

export default function InteractiveStarRating({
  currentRating = 0,
  onRatingChange,
  disabled = false,
  size = 'lg'
}: InteractiveStarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0)
  const [clickedIndex, setClickedIndex] = useState<number | null>(null)
  const starRefs = useRef<(HTMLButtonElement | null)[]>([])

  // 根据size设置星星大小
  const starSizeClass = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-5 h-5'
  }[size]

  // 显示评分（悬停时显示悬停评分，否则显示当前评分）
  const displayRating = hoverRating || currentRating || 0

  const handleStarClick = (index: number, event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return
    
    const button = event.currentTarget
    const rect = button.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const buttonWidth = rect.width
    
    // 判断点击位置：左半部分 = 0.5星，右半部分 = 1星
    const isLeftHalf = clickX < buttonWidth / 2
    const rating = index + (isLeftHalf ? 0.5 : 1)
    
    setClickedIndex(index)
    
    // 添加点击动效（缩放和脉冲效果）
    setTimeout(() => {
      setClickedIndex(null)
    }, 400)
    
    // 立即调用回调提交评分
    onRatingChange(rating)
  }

  const handleStarHover = (index: number, event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return
    
    const button = event.currentTarget
    const rect = button.getBoundingClientRect()
    const hoverX = event.clientX - rect.left
    const buttonWidth = rect.width
    
    // 判断悬停位置：左半部分 = 0.5星，右半部分 = 1星
    const isLeftHalf = hoverX < buttonWidth / 2
    const rating = index + (isLeftHalf ? 0.5 : 1)
    
    setHoverRating(rating)
  }

  const handleMouseLeave = () => {
    setHoverRating(0)
  }

  return (
    <div 
      className="flex items-center gap-1"
      onMouseLeave={handleMouseLeave}
    >
      {Array.from({ length: 5 }).map((_, index) => {
        const starBaseValue = index + 1
        const starMinValue = index + 0.5
        const isFilled = starBaseValue <= displayRating
        const isHalfFilled = displayRating >= starMinValue && displayRating < starBaseValue
        const isClicked = clickedIndex === index

        return (
          <button
            key={index}
            ref={(el) => { starRefs.current[index] = el }}
            type="button"
            onClick={(e) => handleStarClick(index, e)}
            onMouseMove={(e) => handleStarHover(index, e)}
            disabled={disabled}
            className={`
              relative transition-all duration-200 ease-out
              ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110 active:scale-95'}
              ${isClicked ? 'scale-125' : ''}
            `}
          >
            {/* 背景星星（灰色） */}
            <Star
              className={`
                ${starSizeClass}
                text-gray-300
              `}
            />
            {/* 前景星星（黄色，根据评分显示） */}
            <div 
              className={`
                absolute inset-0 overflow-hidden
                transition-all duration-200 ease-out
                pointer-events-none
              `}
              style={{
                width: isFilled ? '100%' : isHalfFilled ? '50%' : '0%'
              }}
            >
              <Star
                className={`
                  ${starSizeClass}
                  fill-yellow-400 text-yellow-400 drop-shadow-sm
                  ${isClicked ? 'animate-bounce' : ''}
                `}
              />
            </div>
          </button>
        )
      })}
    </div>
  )
}
