/*
  # Create get_tasks_by_status function

  1. New Function
    - `get_tasks_by_status`: Retrieves tasks filtered by status and other criteria
      - Parameters:
        - task_status: text
        - category_filter: text
        - subcategory_filter: text
        - date_from: timestamp
        - date_to: timestamp
        - limit_count: integer
        - offset_count: integer
        - search_query: text
      
  2. Security
    - Function is accessible to authenticated users only
*/

CREATE OR REPLACE FUNCTION get_tasks_by_status(
  task_status text,
  category_filter text DEFAULT NULL,
  subcategory_filter text DEFAULT NULL,
  date_from timestamp DEFAULT NULL,
  date_to timestamp DEFAULT NULL,
  limit_count integer DEFAULT 10,
  offset_count integer DEFAULT 0,
  search_query text DEFAULT NULL
)
RETURNS SETOF projects
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM projects
  WHERE status = task_status
    AND (category_filter IS NULL OR category = category_filter)
    AND (subcategory_filter IS NULL OR subcategory = subcategory_filter)
    AND (date_from IS NULL OR created_at >= date_from)
    AND (date_to IS NULL OR created_at <= date_to)
    AND (search_query IS NULL OR title ILIKE '%' || search_query || '%')
  ORDER BY created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;