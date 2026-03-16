-- RPC 函数：原子性地增加模版下载次数
CREATE OR REPLACE FUNCTION increment_template_download(p_template_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- 使用 INSERT ... ON CONFLICT 来原子性地更新或插入
  INSERT INTO t_template_downloads (template_id, download_count, updated_at)
  VALUES (p_template_id, 1, NOW())
  ON CONFLICT (template_id) 
  DO UPDATE SET 
    download_count = t_template_downloads.download_count + 1,
    updated_at = NOW()
  RETURNING download_count INTO v_count;
  
  RETURN v_count;
END;
$$;
