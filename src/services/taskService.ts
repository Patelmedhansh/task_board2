import { supabase } from "../supabaseClient";
import { Task } from "../types/tasks";

export async function fetchTasksByStatusRPC({
  status,
  categoryFilter,
  subcategoryFilter,
  dateRange,
  searchQuery,
  limit,
  offset,
}: {
  status: string;
  categoryFilter?: string | null;
  subcategoryFilter?: string | null;
  dateRange?: { from: string | null; to: string | null };
  searchQuery?: string | null;
  limit?: number;
  offset?: number;
}): Promise<Task[]> {
  const { data, error } = await supabase.rpc("get_tasks_by_status", {
    task_status: status,
    category_filter: categoryFilter,
    subcategory_filter: subcategoryFilter,
    date_from: dateRange?.from,
    date_to: dateRange?.to,
    limit_count: limit,
    offset_count: offset,
    search_query: searchQuery,
  });

  return !error && data ? (data as Task[]) : [];
}

export async function updateTaskStatus(taskId: string, newStatus: string) {
  return await supabase.rpc("update_task_status", {
    task_id: taskId,
    new_status: newStatus,
  });
}
