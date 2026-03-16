-- RPC 函数：简单的 JOIN 查询模板
CREATE OR REPLACE FUNCTION rpc_get_templates(
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 12,
  p_search_q TEXT DEFAULT NULL,
  p_category_ids UUID[] DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_from INTEGER;
  v_total BIGINT;
  v_templates JSON;
BEGIN
  v_from := (p_page - 1) * p_page_size;

  -- 查询总数
  SELECT COUNT(DISTINCT t.id) INTO v_total
  FROM t_templates t
  LEFT JOIN t_template_categories c ON c.template_id = t.id
  WHERE (t.deleted_at IS NULL) AND t.status='published'
    AND (p_search_q IS NULL OR p_search_q = '' OR t.title ILIKE '%' || p_search_q || '%' OR t.description ILIKE '%' || p_search_q || '%')
    AND (p_category_ids IS NULL OR c.category_id = ANY(p_category_ids));

  -- 查询模板列表
  WITH template_list AS (
    SELECT DISTINCT t.id, t.title, COALESCE(t.description, '') as description,
           COALESCE(t.template_url, '') as template_url, COALESCE(t.thum_cover_url, '') as cover_url,
           COALESCE(t.price, 0) as price,
           t.created_at
    FROM t_templates t
    LEFT JOIN t_template_categories c ON c.template_id = t.id
    WHERE (t.deleted_at IS NULL) AND t.status = 'published'
      AND (p_search_q IS NULL OR p_search_q = '' OR t.title ILIKE '%' || p_search_q || '%' OR t.description ILIKE '%' || p_search_q || '%')
      AND (p_category_ids IS NULL OR c.category_id = ANY(p_category_ids))
    ORDER BY t.created_at DESC
    LIMIT p_page_size OFFSET v_from
  ),
  categories AS (
    SELECT tl.id, ARRAY_AGG(tc.category_id) as category_ids
    FROM template_list tl
    LEFT JOIN t_template_categories tc ON tc.template_id = tl.id
    GROUP BY tl.id
  ),
  download_counts AS (
    SELECT 
      tl.id,
      COALESCE(td.download_count, 0)::INTEGER as downloads
    FROM template_list tl
    LEFT JOIN t_template_downloads td ON td.template_id = tl.id
  ),
  ratings AS (
    SELECT 
      tl.id,
      COALESCE(tr.average_rating, 4.0)::DECIMAL(3, 1) as rating
    FROM template_list tl
    LEFT JOIN t_template_ratings tr ON tr.template_id = tl.id
  )
  SELECT json_agg(
    json_build_object(
      'id', tl.id,
      'title', tl.title,
      'description', tl.description,
      'template_url', tl.template_url,
      'cover_url', tl.cover_url,
      'price', tl.price,
      'created_at', tl.created_at,
      'downloads', COALESCE(dc.downloads, 0),
      'rating', COALESCE(r.rating, 4.0),
      'categoryIds', COALESCE(c.category_ids, ARRAY[]::UUID[])
    )
    ORDER BY tl.created_at DESC
  ) INTO v_templates
  FROM template_list tl
  LEFT JOIN categories c ON tl.id = c.id
  LEFT JOIN download_counts dc ON tl.id = dc.id
  LEFT JOIN ratings r ON tl.id = r.id;

  RETURN json_build_object(
    'templates', COALESCE(v_templates, '[]'::json),
    'total', v_total,
    'page', p_page,
    'pageSize', p_page_size
  );
END;
$$;

