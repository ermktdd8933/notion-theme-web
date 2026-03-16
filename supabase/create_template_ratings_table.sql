-- 创建模版评分表（每个模版一条记录，存储总评分和评分数量）
CREATE TABLE IF NOT EXISTS public.t_template_ratings (
  template_id UUID NOT NULL,
  total_rating DECIMAL(10, 1) NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  average_rating DECIMAL(3, 1) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT t_template_ratings_pkey PRIMARY KEY (template_id),
  CONSTRAINT t_template_ratings_template_id_fkey FOREIGN KEY (template_id) REFERENCES t_templates (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- 创建用户模版评分明细表（记录每个用户对每个模版的评分）
CREATE TABLE IF NOT EXISTS public.t_user_template_ratings (
  id BIGSERIAL PRIMARY KEY,
  template_id UUID NOT NULL,
  user_id UUID NOT NULL,
  rating DECIMAL(2, 1) NOT NULL CHECK (rating >= 0.5 AND rating <= 5.0 AND (rating * 2)::INTEGER = rating * 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT t_user_template_ratings_template_id_fkey FOREIGN KEY (template_id) REFERENCES t_templates (id) ON DELETE CASCADE,
  CONSTRAINT t_user_template_ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT t_user_template_ratings_unique UNIQUE (template_id, user_id)
) TABLESPACE pg_default;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_template_ratings_updated_at ON public.t_template_ratings (updated_at);
CREATE INDEX IF NOT EXISTS idx_user_template_ratings_template_id ON public.t_user_template_ratings (template_id);
CREATE INDEX IF NOT EXISTS idx_user_template_ratings_user_id ON public.t_user_template_ratings (user_id);
CREATE INDEX IF NOT EXISTS idx_user_template_ratings_created_at ON public.t_user_template_ratings (created_at);

-- 添加注释
COMMENT ON TABLE public.t_template_ratings IS '模版评分表，每个模版一条记录，存储总评分、评分数量和平均评分';
COMMENT ON COLUMN public.t_template_ratings.template_id IS '模版ID（主键）';
COMMENT ON COLUMN public.t_template_ratings.total_rating IS '总评分（所有评分的总和）';
COMMENT ON COLUMN public.t_template_ratings.rating_count IS '评分数量';
COMMENT ON COLUMN public.t_template_ratings.average_rating IS '平均评分（总评分/评分数量）';
COMMENT ON COLUMN public.t_template_ratings.updated_at IS '最后更新时间';

COMMENT ON TABLE public.t_user_template_ratings IS '用户模版评分明细表，记录每个用户对每个模版的评分';
COMMENT ON COLUMN public.t_user_template_ratings.template_id IS '模版ID';
COMMENT ON COLUMN public.t_user_template_ratings.user_id IS '用户ID';
COMMENT ON COLUMN public.t_user_template_ratings.rating IS '评分（0.5-5.0，步长0.5）';
COMMENT ON COLUMN public.t_user_template_ratings.created_at IS '创建时间';
COMMENT ON COLUMN public.t_user_template_ratings.updated_at IS '更新时间';
