import { useReducer } from "react";
import { supabase } from "../supabaseClient";
import { Task } from "../types/tasks";
import { useEffect } from "react";

export const statusKeyArray = ["to-do", "in-progress", "done"] as const;
export type StatusKey = (typeof statusKeyArray)[number];

type State = {
  tasksByStatus: Record<StatusKey, Task[]>;
  statusFilter: string | null;
  categoryFilter: string | null;
  subcategoryFilter: string | null;
  dateRange: { from: string | null; to: string | null };
  limit: number | null;
  page: number;
  loading: boolean;
  hasMore: boolean;
  searchQuery: string | null;
  totalCountByStatus: Record<StatusKey, number>;
};

type Action =
  | { type: "SET_TASKS_BY_STATUS"; payload: Record<StatusKey, Task[]> }
  | { type: "SET_STATUS_FILTER"; payload: string | null }
  | { type: "SET_CATEGORY_FILTER"; payload: string | null }
  | { type: "SET_SUBCATEGORY_FILTER"; payload: string | null }
  | { type: "SET_DATE_RANGE"; payload: { from: string | null; to: string | null } }
  | { type: "SET_LIMIT"; payload: number | null }
  | { type: "SET_PAGE"; payload: number }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_HAS_MORE"; payload: boolean }
  | { type: "SET_SEARCH_QUERY"; payload: string | null }
  | { type: "SET_TOTAL_COUNT_BY_STATUS"; payload: Record<StatusKey, number> }
  | { type: "RESET_PAGINATION" };

const initialState: State = {
  tasksByStatus: {
    "to-do": [],
    "in-progress": [],
    done: [],
  },
  statusFilter: null,
  categoryFilter: null,
  subcategoryFilter: null,
  dateRange: { from: null, to: null },
  limit: null,
  page: 0,
  loading: false,
  hasMore: true,
  searchQuery: null,
  totalCountByStatus: {
    "to-do": 0,
    "in-progress": 0,
    done: 0,
  },
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_TASKS_BY_STATUS":
      return { ...state, tasksByStatus: action.payload };
    case "SET_STATUS_FILTER":
      return { ...state, statusFilter: action.payload };
    case "SET_CATEGORY_FILTER":
      return { ...state, categoryFilter: action.payload };
    case "SET_SUBCATEGORY_FILTER":
      return { ...state, subcategoryFilter: action.payload };
    case "SET_DATE_RANGE":
      return { ...state, dateRange: action.payload };
    case "SET_LIMIT":
      return { ...state, limit: action.payload };
    case "SET_PAGE":
      return { ...state, page: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_HAS_MORE":
      return { ...state, hasMore: action.payload };
    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload };
    case "SET_TOTAL_COUNT_BY_STATUS":
      return { ...state, totalCountByStatus: action.payload };
    case "RESET_PAGINATION":
      return {
        ...state,
        page: 0,
        hasMore: true,
        tasksByStatus: {
          "to-do": [],
          "in-progress": [],
          done: [],
        },
      };
    default:
      return state;
  }
}


const statusKeyToStatusLabel = (key: StatusKey) =>
  key === "to-do" ? "To Do" : key === "in-progress" ? "In Progress" : "Done";

export function useTasks() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const pageSize = 10;

  const setTasksByStatus = (val: Record<StatusKey, Task[]>) =>
    dispatch({ type: "SET_TASKS_BY_STATUS", payload: val });
  const setStatusFilter = (val: string | null) =>
    dispatch({ type: "SET_STATUS_FILTER", payload: val });
  const setCategoryFilter = (val: string | null) =>
    dispatch({ type: "SET_CATEGORY_FILTER", payload: val });
  const setSubcategoryFilter = (val: string | null) =>
    dispatch({ type: "SET_SUBCATEGORY_FILTER", payload: val });
  const setDateRange = (val: { from: string | null; to: string | null }) =>
    dispatch({ type: "SET_DATE_RANGE", payload: val });
  const setLimit = (val: number | null) =>
    dispatch({ type: "SET_LIMIT", payload: val });
  const setPage = (val: number) =>
    dispatch({ type: "SET_PAGE", payload: val });
  const setLoading = (val: boolean) =>
    dispatch({ type: "SET_LOADING", payload: val });
  const setHasMore = (val: boolean) =>
    dispatch({ type: "SET_HAS_MORE", payload: val });
  const setSearchQuery = (val: string | null) =>
    dispatch({ type: "SET_SEARCH_QUERY", payload: val });
  const setTotalCountByStatus = (val: Record<StatusKey, number>) =>
    dispatch({ type: "SET_TOTAL_COUNT_BY_STATUS", payload: val });
  const resetPagination = () => dispatch({ type: "RESET_PAGINATION" });

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
      (reset ? 0 : state.page * (filters.limit ?? state.limit ?? pageSize));
    const limitCount = filters.limit ?? state.limit ?? pageSize;

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
    console.log("length:", data.length, status);

    return !error && data ? (data as Task[]) : [];
  };

  const loadMoreTasks = async (reset = false) => {
    setLoading(true);

    const statuses = ["To Do", "In Progress", "Done"] as const;
    let newTasksByStatus: Record<StatusKey, Task[]> = reset
      ? { "to-do": [], "in-progress": [], "done": [] }
      : { ...state.tasksByStatus };

    let tasksFetched = false;

    const currentPage = reset ? 0 : state.page;
    const nextPage = reset ? 1 : state.page + 1;

    for (const status of statuses) {
      const key = status.toLowerCase().replace(" ", "-") as StatusKey;

      const isSelected = state.statusFilter === null || state.statusFilter === status;

      const filtersToApply = {
        categoryFilter: isSelected ? state.categoryFilter : null,
        subcategoryFilter: isSelected ? state.subcategoryFilter : null,
        dateRange: isSelected ? state.dateRange : { from: null, to: null },
        searchQuery: isSelected ? state.searchQuery : null,
        limit: state.limit,
        offset: currentPage * (state.limit ?? pageSize),
      };

      const fetchedTasks = await fetchTasksByStatus(status, filtersToApply, reset);
      if (fetchedTasks.length > 0) tasksFetched = true;

      newTasksByStatus[key] = reset
        ? fetchedTasks
        : [...(state.tasksByStatus[key] || []), ...fetchedTasks];
    }

    setTasksByStatus(newTasksByStatus);

    if (!tasksFetched) {
      setHasMore(false);
    } else {
      setPage(nextPage);
    }
    setLoading(false);
  };

  const moveTask = async (
    taskId: string,
    sourceCol: StatusKey,
    destCol: StatusKey,
    destIndex: number
  ) => {
    const task = state.tasksByStatus[sourceCol].find(
      (t) => t.id.toString() === taskId
    );
    if (!task) return;

    const newSourceTasks = state.tasksByStatus[sourceCol].filter(
      (t) => t.id.toString() !== taskId
    );
    const updatedTask: Task = {
      ...task,
      status: statusKeyToStatusLabel(destCol),
    };
    const newDestTasks = state.tasksByStatus[destCol].filter(
      (t) => t.id.toString() !== taskId
    );
    newDestTasks.splice(destIndex, 0, updatedTask);

    const updated = {
      ...state.tasksByStatus,
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

  const findColumnOfTask = (taskId: string): StatusKey | null => {
    for (const key of statusKeyArray) {
      if (state.tasksByStatus[key].some((task) => task.id.toString() === taskId)) {
        return key;
      }
    }
    return null;
  };

  const fetchStatusWiseCounts = async () => {
    const statusLabels: Record<StatusKey, string> = {
      "to-do": "To Do",
      "in-progress": "In Progress",
      "done": "Done",
    };

    const counts: Record<StatusKey, number> = {
      "to-do": 0,
      "in-progress": 0,
      "done": 0,
    };

    for (const key of statusKeyArray) {
      let query = supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("status", statusLabels[key]);

      if (state.statusFilter === null || state.statusFilter === statusLabels[key]) {
        if (state.categoryFilter) query = query.eq("category", state.categoryFilter);
        if (state.subcategoryFilter) query = query.eq("subcategory", state.subcategoryFilter);
        if (state.dateRange?.from && state.dateRange?.to) {
          query = query.gte("created_at", state.dateRange.from).lte("created_at", state.dateRange.to);
        }
        if (state.searchQuery) query = query.ilike("title", `%${state.searchQuery}%`);
      }

      const { count } = await query;
      if (typeof count === "number") counts[key] = count;
    }

    setTotalCountByStatus(counts);
  };

  // useEffect(() => {
  //   resetPagination();
  //   loadMoreTasks(true);
  //   fetchStatusWiseCounts();
  // }, [
  //   state.statusFilter,
  //   state.categoryFilter,
  //   state.subcategoryFilter,
  //   state.dateRange.from,
  //   state.dateRange.to,
  //   state.searchQuery,
  //   state.limit,
  // ]);

useEffect(() => {
  const channel = supabase
    .channel("realtime-projects")
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'projects'
      },
      (payload) => {
        loadMoreTasks(true);
        fetchStatusWiseCounts(); 
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [loadMoreTasks, fetchStatusWiseCounts]);


  return {
    tasksByStatus: state.tasksByStatus,
    setTasksByStatus,
    statusFilter: state.statusFilter,
    setStatusFilter,
    categoryFilter: state.categoryFilter,
    setCategoryFilter,
    subcategoryFilter: state.subcategoryFilter,
    setSubcategoryFilter,
    dateRange: state.dateRange,
    setDateRange,
    limit: state.limit,
    setLimit,
    loadMoreTasks,
    loading: state.loading,
    hasMore: state.hasMore,
    resetPagination,
    moveTask,
    findColumnOfTask,
    searchQuery: state.searchQuery,
    setSearchQuery,
    fetchStatusWiseCounts,
    totalCountByStatus: state.totalCountByStatus,
    statusKeyArray,
  };
}
