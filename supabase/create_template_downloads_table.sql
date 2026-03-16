-- 创建模版下载统计表（每个模版一条记录，存储下载次数）
CREATE TABLE IF NOT EXISTS public.t_template_downloads (
  template_id UUID NOT NULL,
  download_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT t_template_downloads_pkey PRIMARY KEY (template_id),
  CONSTRAINT t_template_downloads_template_id_fkey FOREIGN KEY (template_id) REFERENCES t_templates (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_template_downloads_updated_at ON public.t_template_downloads (updated_at);

-- 添加注释
COMMENT ON TABLE public.t_template_downloads IS '模版下载统计表，每个模版一条记录，存储下载次数';
COMMENT ON COLUMN public.t_template_downloads.template_id IS '模版ID（主键）';
COMMENT ON COLUMN public.t_template_downloads.download_count IS '下载次数';
COMMENT ON COLUMN public.t_template_downloads.updated_at IS '最后更新时间';
