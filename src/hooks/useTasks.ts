import { useState } from "react";
import { supabase } from "../supabaseClient";
import { Task } from "../types/tasks";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksByStatus, setTasksByStatus] = useState<Record<string, Task[]>>({
    "to-do": [],
    "in-progress": [],
    done: [],
  });
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: string | null; to: string | null }>({ from: null, to: null });
  const [limit, setLimit] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const pageSize = 10;

  const resetPagination = () => {
    setTasks([]);
    setPage(0);
    setHasMore(true);
  };

  const loadMoreTasks = async (reset = false) => {
    setLoading(true);
    const from = reset ? 0 : page * pageSize;

    const { data, error } = await supabase.rpc("get_tasks_filtered", {
      status_filter: statusFilter,
      category_filter: categoryFilter,
      date_from: dateRange.from,
      date_to: dateRange.to,
      limit_count: limit ?? pageSize,
      offset_count: from,
    });

    if (!error && data) {
      const combined = reset ? data : [...tasks, ...data];
      const uniqueCombined = Array.from(new Map((combined as Task[]).map((task) => [task.id, task])).values());
      setTasks(uniqueCombined);

      const grouped: Record<string, Task[]> = { "to-do": [], "in-progress": [], done: [] };
      uniqueCombined.forEach((task) => {
        const safeStatus = task.status.toLowerCase().replace(" ", "-");
        if (grouped[safeStatus]) grouped[safeStatus].push(task);
      });
      setTasksByStatus(grouped);

      if (data.length < pageSize) setHasMore(false);
      setPage((prev) => (reset ? 1 : prev + 1));
    }

    setLoading(false);
  };

  const moveTask = async (taskId: string, sourceCol: string, destCol: string, destIndex: number) => {
    const task = tasksByStatus[sourceCol].find((t) => t.id.toString() === taskId);
    if (!task) return;

    // Avoid unnecessary move
    if (sourceCol === destCol && tasksByStatus[destCol][destIndex]?.id.toString() === taskId) {
      return;
    }

    // Remove task from source column
    const newSourceTasks = tasksByStatus[sourceCol].filter((t) => t.id.toString() !== taskId);

    // Update the task status
    const updatedTask: Task = { ...task, status: convertColumnIdToStatus(destCol) };

    // Insert task into destination at the correct index
    const newDestTasks = [...tasksByStatus[destCol]];
    newDestTasks.splice(destIndex, 0, updatedTask);

    // Update local state
    const updated = {
      ...tasksByStatus,
      [sourceCol]: newSourceTasks,
      [destCol]: newDestTasks,
    };
    setTasksByStatus(updated);

    // Update database
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
      case "to-do":
        return "To Do";
      case "in-progress":
        return "In Progress";
      case "done":
        return "Done";
      default:
        return columnId;
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

  return {
    tasks,
    setTasks,
    tasksByStatus,
    setTasksByStatus,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
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
  };
}
