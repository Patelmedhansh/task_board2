/*
  # Optimized Task Query Function
  
  1. Changes
    - Replace OFFSET pagination with keyset pagination
    - Add cursor-based pagination support
    - Optimize text search using GIN indexes
    
  2. Benefits
    - Consistent performance regardless of page depth
    - Better scalability for large datasets
    - Faster text search using indexes
*/

CREATE OR REPLACE FUNCTION get_tasks_by_status(
  task_status text,
  category_filter text DEFAULT NULL,
  subcategory_filter text DEFAULT NULL,
  date_from timestamp with time zone DEFAULT NULL,
  date_to timestamp with time zone DEFAULT NULL,
  limit_count integer DEFAULT 10,
  last_seen_created_at timestamp with time zone DEFAULT NULL,
  search_query text DEFAULT NULL
) RETURNS SETOF projects AS $$
BEGIN
  RETURN QUERY
  WITH filtered_tasks AS (
    SELECT *
    FROM projects
    WHERE status = task_status
      AND (category_filter IS NULL OR category = category_filter)
      AND (subcategory_filter IS NULL OR subcategory = subcategory_filter)
      AND (date_from IS NULL OR created_at >= date_from)
      AND (date_to IS NULL OR created_at <= date_to)
      AND (search_query IS NULL OR 
           title ILIKE '%' || search_query || '%' OR 
           description ILIKE '%' || search_query || '%')
      AND (last_seen_created_at IS NULL OR created_at < last_seen_created_at)
  )
  SELECT *
  FROM filtered_tasks
  ORDER BY created_at DESC, id DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;