import { useState } from "react";
import { supabase } from "../supabaseClient";
import { Task } from "../types/tasks";

export function useTasks() {
  const [tasksByStatus, setTasksByStatus] = useState<Record<string, Task[]>>({
    "to-do": [],
    "in-progress": [],
    done: [],
  });

  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [subcategoryFilter, setSubcategoryFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: string | null; to: string | null }>({ from: null, to: null });
  const [limit, setLimit] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string | null>(null);

  const [totalCountByStatus, setTotalCountByStatus] = useState<Record<string, number>>({
    "to-do": 0,
    "in-progress": 0,
    "done": 0,
  });

  const pageSize = 10;

  const resetPagination = () => {
    setPage(0);
    setHasMore(true);
  };

  const fetchTasksByStatus = async (status: string, reset = false) => {
    const offset = reset ? 0 : page * pageSize;

    const { data, error } = await supabase.rpc("get_tasks_by_status", {
      task_status: status,
      category_filter: categoryFilter,
      subcategory_filter: subcategoryFilter,
      date_from: dateRange.from,
      date_to: dateRange.to,
      limit_count: limit ?? pageSize,
      offset_count: offset,
      search_query: searchQuery,
    });

    return !error && data ? data : [];
  };

  const loadMoreTasks = async (reset = false) => {
    setLoading(true);

    const statuses = ["To Do", "In Progress", "Done"];
    const result: Record<string, Task[]> = {
      "to-do": [],
      "in-progress": [],
      done: [],
    };

    for (const status of statuses) {
      const key = status.toLowerCase().replace(" ", "-");
      result[key] = await fetchTasksByStatus(status, reset);
    }

    setTasksByStatus(result);
    if (result["to-do"].length < pageSize && result["in-progress"].length < pageSize && result["done"].length < pageSize) {
      setHasMore(false);
    }
    setPage((prev) => (reset ? 1 : prev + 1));
    setLoading(false);
  };

  const moveTask = async (taskId: string, sourceCol: string, destCol: string, destIndex: number) => {
    const task = tasksByStatus[sourceCol].find((t) => t.id.toString() === taskId);
    if (!task) return;

    const newSourceTasks = tasksByStatus[sourceCol].filter((t) => t.id.toString() !== taskId);
    const updatedTask: Task = { ...task, status: convertColumnIdToStatus(destCol) };
    const newDestTasks = tasksByStatus[destCol].filter((t) => t.id.toString() !== taskId);
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

  const convertColumnIdToStatus = (columnId: string) => {
    switch (columnId) {
      case "to-do": return "To Do";
      case "in-progress": return "In Progress";
      case "done": return "Done";
      default: return columnId;
    }
  };

  const findColumnOfTask = (taskId: string): string | null => {
    for (const [colId, taskList] of Object.entries(tasksByStatus)) {
      if (taskList.some((task) => task.id.toString() === taskId)) {
        return colId;
      }
    }
    return null;
  };

  const fetchStatusWiseCounts = async () => {
    const statusLabels: Record<string, string> = {
      "to-do": "To Do",
      "in-progress": "In Progress",
      "done": "Done",
    };

    const counts: Record<string, number> = {
      "to-do": 0,
      "in-progress": 0,
      "done": 0,
    };

    for (const key of Object.keys(statusLabels)) {
      let query = supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("status", statusLabels[key]);

      if (categoryFilter) query = query.eq("category", categoryFilter);
      if (subcategoryFilter) query = query.eq("subcategory", subcategoryFilter);
      if (dateRange?.from && dateRange?.to) {
        query = query.gte("created_at", dateRange.from).lte("created_at", dateRange.to);
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
  };
}
