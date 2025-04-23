import { useState } from "react";
import { supabase } from "../supabaseClient";
import { Task } from "../types/tasks";

// Define column/status keys and their types
export const statusKeyArray = ["to-do", "in-progress", "done"] as const;
export type StatusKey = (typeof statusKeyArray)[number];

export function useTasks() {
  const [tasksByStatus, setTasksByStatus] = useState<Record<StatusKey, Task[]>>(
    {
      "to-do": [],
      "in-progress": [],
      done: [],
    }
  );
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [subcategoryFilter, setSubcategoryFilter] = useState<string | null>(
    null
  );
  const [dateRange, setDateRange] = useState<{
    from: string | null;
    to: string | null;
  }>({ from: null, to: null });
  const [limit, setLimit] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string | null>(null);

  const [totalCountByStatus, setTotalCountByStatus] = useState<
    Record<StatusKey, number>
  >({
    "to-do": 0,
    "in-progress": 0,
    done: 0,
  });

  const pageSize = 10;

  const resetPagination = () => {
    setPage(0);
    setHasMore(true);
    setTasksByStatus({
      "to-do": [],
      "in-progress": [],
      done: [],
    });
  };

  // Convert UI/status key ("to-do") to DB status ("To Do")
  const statusKeyToStatusLabel = (key: StatusKey) =>
    key === "to-do" ? "To Do" : key === "in-progress" ? "In Progress" : "Done";

  // Convert DB status ("To Do") to UI/status key ("to-do")
  const statusLabelToStatusKey = (label: string): StatusKey => {
    if (label === "To Do") return "to-do";
    if (label === "In Progress") return "in-progress";
    return "done";
  };

  const fetchTasksByStatus = async (
    status: string,
    filters: {
      categoryFilter?: string | null;
      subcategoryFilter?: string | null;
      dateRange?: { from: string | null; to: string | null };
      searchQuery?: string | null;
      limit?: number | null;
      offset?: number;
    },
    reset = false
  ): Promise<Task[]> => {
    const offset =
      filters.offset ??
      (reset ? 0 : page * (filters.limit ?? limit ?? pageSize));
    const limitCount = filters.limit ?? limit ?? pageSize;

    const { data, error } = await supabase.rpc("get_tasks_by_status", {
      task_status: status,
      category_filter: filters.categoryFilter,
      subcategory_filter: filters.subcategoryFilter,
      date_from: filters.dateRange?.from,
      date_to: filters.dateRange?.to,
      limit_count: limitCount,
      offset_count: offset,
      search_query: filters.searchQuery,
    });

    return !error && data ? (data as Task[]) : [];
  };

  const statusKeyArray = ["to-do", "in-progress", "done"] as const;
  type StatusKey = (typeof statusKeyArray)[number];
  const statusMap: Record<StatusKey, string> = {
    "to-do": "To Do",
    "in-progress": "In Progress",
    done: "Done",
  };

  const loadMoreTasks = async (reset = false) => {
    setLoading(true);
  
    const statuses = ["To Do", "In Progress", "Done"] as const;
    let newTasksByStatus: Record<StatusKey, Task[]> = reset
      ? { "to-do": [], "in-progress": [], "done": [] }
      : { ...tasksByStatus };
  
    let tasksFetched = false;
  
    for (const status of statuses) {
      const key = status.toLowerCase().replace(" ", "-") as StatusKey;
  
      // Build filters object: only apply all filters to selected status, null for others
      const isSelected = statusFilter === null || statusFilter === status;
  
      const filtersToApply = {
        categoryFilter: isSelected ? categoryFilter : null,
        subcategoryFilter: isSelected ? subcategoryFilter : null,
        dateRange: isSelected ? dateRange : { from: null, to: null },
        searchQuery: isSelected ? searchQuery : null,
        limit,
        offset: reset ? 0 : page * (limit ?? pageSize),
      };
  
      const fetchedTasks = await fetchTasksByStatus(status, filtersToApply, reset);
      if (fetchedTasks.length > 0) tasksFetched = true;
  
      newTasksByStatus[key] = reset
        ? fetchedTasks
        : [...(tasksByStatus[key] || []), ...fetchedTasks];
    }
  
    setTasksByStatus(newTasksByStatus);
  
    if (!tasksFetched) setHasMore(false);
    setPage((prev) => (reset ? 1 : prev + 1));
    setLoading(false);
  };  
  

  const moveTask = async (
    taskId: string,
    sourceCol: StatusKey,
    destCol: StatusKey,
    destIndex: number
  ) => {
    const task = tasksByStatus[sourceCol].find(
      (t) => t.id.toString() === taskId
    );
    if (!task) return;

    const newSourceTasks = tasksByStatus[sourceCol].filter(
      (t) => t.id.toString() !== taskId
    );
    const updatedTask: Task = {
      ...task,
      status: statusKeyToStatusLabel(destCol),
    };
    const newDestTasks = tasksByStatus[destCol].filter(
      (t) => t.id.toString() !== taskId
    );
    newDestTasks.splice(destIndex, 0, updatedTask);

    const updated = {
      ...tasksByStatus,
      [sourceCol]: newSourceTasks,
      [destCol]: newDestTasks,
    };
    setTasksByStatus(updated);

    const { error } = await supabase.rpc("update_task_status", {
      task_id: task.id,
      new_status: updatedTask.status,
    });

    if (error) {
      console.error("Failed to update task status:", error);
    }
  };

  // Find column for a task (returns StatusKey or null)
  const findColumnOfTask = (taskId: string): StatusKey | null => {
    for (const key of statusKeyArray) {
      if (tasksByStatus[key].some((task) => task.id.toString() === taskId)) {
        return key;
      }
    }
    return null;
  };

  const fetchStatusWiseCounts = async () => {
    const statusLabels: Record<StatusKey, string> = {
      "to-do": "To Do",
      "in-progress": "In Progress",
      done: "Done",
    };

    const counts: Record<StatusKey, number> = {
      "to-do": 0,
      "in-progress": 0,
      done: 0,
    };

    for (const key of statusKeyArray) {
      let query = supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("status", statusLabels[key]);

      if (categoryFilter) query = query.eq("category", categoryFilter);
      if (subcategoryFilter) query = query.eq("subcategory", subcategoryFilter);
      if (dateRange?.from && dateRange?.to) {
        query = query
          .gte("created_at", dateRange.from)
          .lte("created_at", dateRange.to);
      }
      if (searchQuery) query = query.ilike("title", `%${searchQuery}%`);

      const { count } = await query;
      if (typeof count === "number") counts[key] = count;
    }

    setTotalCountByStatus(counts);
  };

  return {
    tasksByStatus,
    setTasksByStatus,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    subcategoryFilter,
    setSubcategoryFilter,
    dateRange,
    setDateRange,
    limit,
    setLimit,
    loadMoreTasks,
    loading,
    hasMore,
    resetPagination,
    moveTask,
    findColumnOfTask,
    searchQuery,
    setSearchQuery,
    fetchStatusWiseCounts,
    totalCountByStatus,
    statusKeyArray, // Export for Dashboard map/iteration if needed
  };
}
