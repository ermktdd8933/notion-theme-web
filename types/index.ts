// 模板类型定义
export interface Template {
  id: string;
  title: string;
  description: string;
  // New API fields
  template_url?: string;
  cover_url?: string;
  openUrl?: string;
  categoryIds?: string[];
  price?: number;
  pay_url?: string; // 付费模版的支付链接
  author_id?: string; // 作者ID
  author?: {
    id: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  }; // 作者信息
  images?: TemplateImage[]; // 模版图片列表
  downloads: number;
  rating?: number;
  rating_count?: number; // 评分数量
  createdAt?: string;
  created_at?: string;
  // Backcompat optional fields (not used anymore)
  coverImage?: string;
  category?: string;
  subcategory?: string;
  downloadUrl?: string;
}

// 模版图片类型定义
export interface TemplateImage {
  id: number;
  template_id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
}

// 分类类型定义
export interface Subcategory {
  id: string;
  name: string;
  count: number;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  parent_id?: string | null;
  sort_order?: number | null;
  subcategories?: Subcategory[];
}

// 筛选器类型定义
export interface FilterState {
  searchQuery: string;
  selectedCategory: string | null;
  selectedSubcategory: string | null;
}

// 导航菜单类型定义
export interface NavItem {
  title: string;
  href: string;
  description?: string;
}

// 统计数据类型定义
export interface Stats {
  totalTemplates: number;
  totalDownloads: number;
  totalCategories: number;
}
