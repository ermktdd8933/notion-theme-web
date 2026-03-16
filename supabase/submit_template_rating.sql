-- RPC 函数：提交模版评分（如果用户已评分则更新，否则插入新记录）
-- 同时更新模版评分表的总分和平均分
CREATE OR REPLACE FUNCTION submit_template_rating(
  p_template_id UUID,
  p_user_id UUID,
  p_rating DECIMAL(2, 1)
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_old_rating DECIMAL(2, 1);
  v_new_total_rating DECIMAL(10, 1);
  v_new_rating_count INTEGER;
  v_new_average_rating DECIMAL(3, 1);
  v_result JSON;
BEGIN
  -- 验证评分范围（0.5-5.0，步长0.5）
  IF p_rating < 0.5 OR p_rating > 5.0 OR (p_rating * 2)::INTEGER != p_rating * 2 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid rating. Rating must be between 0.5 and 5.0 with step 0.5'
    );
  END IF;

  -- 检查用户是否已经评分过
  SELECT rating INTO v_old_rating
  FROM t_user_template_ratings
  WHERE template_id = p_template_id AND user_id = p_user_id;

  -- 插入或更新用户评分明细
  INSERT INTO t_user_template_ratings (template_id, user_id, rating, updated_at)
  VALUES (p_template_id, p_user_id, p_rating, NOW())
  ON CONFLICT (template_id, user_id)
  DO UPDATE SET
    rating = p_rating,
    updated_at = NOW()
  RETURNING rating INTO v_old_rating;

  -- 获取当前模版的评分统计
  SELECT 
    COALESCE(SUM(rating), 0),
    COALESCE(COUNT(*), 0)
  INTO v_new_total_rating, v_new_rating_count
  FROM t_user_template_ratings
  WHERE template_id = p_template_id;

  -- 计算平均评分
  IF v_new_rating_count > 0 THEN
    v_new_average_rating := ROUND((v_new_total_rating / v_new_rating_count)::DECIMAL, 1);
  ELSE
    v_new_average_rating := 0;
  END IF;

  -- 更新或插入模版评分表
  INSERT INTO t_template_ratings (
    template_id,
    total_rating,
    rating_count,
    average_rating,
    updated_at
  )
  VALUES (
    p_template_id,
    v_new_total_rating,
    v_new_rating_count,
    v_new_average_rating,
    NOW()
  )
  ON CONFLICT (template_id)
  DO UPDATE SET
    total_rating = v_new_total_rating,
    rating_count = v_new_rating_count,
    average_rating = v_new_average_rating,
    updated_at = NOW();

  -- 返回结果
  RETURN json_build_object(
    'success', true,
    'rating', p_rating,
    'average_rating', v_new_average_rating,
    'rating_count', v_new_rating_count
  );
END;
$$;
