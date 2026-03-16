# 模版详情功能与下载统计更新说明

## 更新内容

### 1. 模版详情弹窗功能
- **位置**：`components/TemplateDetailModal.tsx`
- **功能**：
  - 点击模版卡片时弹出详情弹窗，不再直接跳转
  - 左侧展示主图和其他图片，支持左右滑动切换
  - 右侧展示作者、标题、描述、价格、下载次数等信息
  - 支持点击缩略图快速切换图片
  - 下载按钮根据免费/付费显示不同文字和跳转逻辑

### 2. 下载统计功能
- **数据库表**：`t_template_downloads`（统计表，每个模版一条记录，存储下载次数）
  - 需要在Supabase中执行 `supabase/create_template_downloads_table.sql` 创建表
  - 需要在Supabase中执行 `supabase/increment_template_download.sql` 创建RPC函数
- **API接口**：
  - `POST /api/templates/[id]/download`：原子性地增加下载次数（使用RPC函数）
  - `GET /api/templates/[id]`：获取模版详情时包含下载次数
- **RPC函数**：
  - `increment_template_download`：原子性地增加模版下载次数（如果不存在则创建，存在则+1）
  - `rpc_get_templates`：更新为从统计表读取真实的下载次数，不再使用随机数

### 3. 模版详情API
- **位置**：`app/api/templates/[id]/route.ts`
- **功能**：
  - 获取模版基本信息
  - 获取模版图片列表（从 `t_template_images` 表）
  - 获取作者信息
  - 获取下载次数统计

### 4. 组件更新
- **TemplateCard**：添加 `onClick` 回调，点击时触发详情弹窗
- **page.tsx**：集成 `TemplateDetailModal` 组件

### 5. 类型定义更新
- **位置**：`types/index.ts`
- **新增字段**：
  - `pay_url`：付费模版的支付链接
  - `author_id`：作者ID
  - `author`：作者信息对象
  - `images`：模版图片列表
  - `TemplateImage`：模版图片类型定义

## 使用说明

### 数据库迁移
1. 在 Supabase Dashboard 中执行 `supabase/create_template_downloads_table.sql` 创建下载统计表
2. 在 Supabase Dashboard 中执行 `supabase/increment_template_download.sql` 创建RPC函数（用于原子性更新下载次数）

### 功能使用
1. 用户点击模版卡片时，会弹出详情弹窗
2. 在详情弹窗中可以：
   - 浏览模版的所有图片（主图 + 其他图片）
   - 查看模版的完整信息
   - 点击下载按钮进行下载（免费模版跳转到模版链接，付费模版跳转到支付链接）

### 下载统计
- 每次点击下载按钮时，会原子性地更新 `t_template_downloads` 表中对应模版的 `download_count` 字段（+1）
- 每个模版在统计表中只有一条记录，存储累计下载次数
- 模版列表和详情中显示的下载次数都是真实的统计数据

## 技术实现

### 图片轮播
- 使用状态管理当前显示的图片索引
- 支持左右箭头切换和缩略图点击切换
- 自动循环播放（到达最后一张时点击下一张会回到第一张）

### 下载逻辑
- 免费模版：跳转到 `openUrl`（经过加密的模版链接）
- 付费模版：跳转到 `pay_url` 字段指定的支付链接
- 下载前会记录下载次数到数据库

### 组件化设计
- `TemplateDetailModal` 是独立的可复用组件
- 通过 props 控制显示和隐藏
- 所有样式与现有设计保持一致

## 注意事项

1. **数据库表**：确保在 Supabase 中创建了 `t_template_downloads` 表
2. **RPC函数**：需要在 Supabase 中更新 `rpc_get_templates` 函数（使用新的SQL文件）
3. **图片数据**：如果模版没有额外图片，只会显示封面图
4. **作者信息**：如果模版没有作者信息，作者区域不会显示
