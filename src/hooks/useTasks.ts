import { useReducer, useCallback, useEffect, useRef, useMemo } from "react";
import { supabase } from "../supabaseClient";
import { Task } from "../types/tasks";
import debounce from "lodash.debounce";

export const statusKeyArray = ["to-do", "in-progress", "done"] as const;
export type StatusKey = (typeof statusKeyArray)[number];

type State = {
  tasksByStatus: Record<StatusKey, Task[]>;
  statusFilter: string | null;
  categoryFilter: string | null;
  subcategoryFilter: string | null;
  dateRange: { from: string | null; to: string | null };
  limit: number | null;
  pageByStatus: Record<StatusKey, number>;
  hasMoreByStatus: Record<StatusKey, boolean>;
  loading: boolean;
  searchQuery: string | null;
  totalCountByStatus: Record<StatusKey, number>;
  filtersChanged: boolean;
};

type Action =
  | { type: "SET_TASKS_BY_STATUS"; payload: Record<StatusKey, Task[]> }
  | { type: "SET_STATUS_FILTER"; payload: string | null }
  | { type: "SET_CATEGORY_FILTER"; payload: string | null }
  | { type: "SET_SUBCATEGORY_FILTER"; payload: string | null }
  | {
      type: "SET_DATE_RANGE";
      payload: { from: string | null; to: string | null };
    }
  | { type: "SET_LIMIT"; payload: number | null }
  | { type: "SET_PAGE_BY_STATUS"; payload: { status: StatusKey; page: number } }
  | {
      type: "SET_HAS_MORE_BY_STATUS";
      payload: { status: StatusKey; hasMore: boolean };
    }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_SEARCH_QUERY"; payload: string | null }
  | { type: "SET_TOTAL_COUNT_BY_STATUS"; payload: Record<StatusKey, number> }
  | { type: "RESET_PAGINATION" }
  | { type: "SET_FILTERS_CHANGED"; payload: boolean }
  | {
      type: "UPDATE_TASKS_FOR_STATUS";
      payload: { status: StatusKey; tasks: Task[] };
    }
  | { type: "UPDATE_SINGLE_TASK"; payload: { task: Task } }
  | { type: "ADD_TASK"; payload: { task: Task } }
  | { type: "REMOVE_TASK"; payload: { taskId: string; statusKey: StatusKey } };

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
  loading: false,
  searchQuery: null,
  pageByStatus: {
    "to-do": 0,
    "in-progress": 0,
    done: 0,
  },
  hasMoreByStatus: {
    "to-do": true,
    "in-progress": true,
    done: true,
  },
  totalCountByStatus: {
    "to-do": 0,
    "in-progress": 0,
    done: 0,
  },
  filtersChanged: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_TASKS_BY_STATUS":
      return { ...state, tasksByStatus: action.payload };
    case "UPDATE_TASKS_FOR_STATUS":
      return {
        ...state,
        tasksByStatus: {
          ...state.tasksByStatus,
          [action.payload.status]: action.payload.tasks,
        },
      };
    case "SET_STATUS_FILTER":
      return { ...state, statusFilter: action.payload, filtersChanged: true };
    case "SET_CATEGORY_FILTER":
      return { ...state, categoryFilter: action.payload, filtersChanged: true };
    case "SET_SUBCATEGORY_FILTER":
      return {
        ...state,
        subcategoryFilter: action.payload,
        filtersChanged: true,
      };
    case "SET_DATE_RANGE":
      return { ...state, dateRange: action.payload, filtersChanged: true };
    case "SET_LIMIT":
      return { ...state, limit: action.payload, filtersChanged: true };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload, filtersChanged: true };
    case "SET_PAGE_BY_STATUS":
      return {
        ...state,
        pageByStatus: {
          ...state.pageByStatus,
          [action.payload.status]: action.payload.page,
        },
      };
    case "SET_HAS_MORE_BY_STATUS":
      return {
        ...state,
        hasMoreByStatus: {
          ...state.hasMoreByStatus,
          [action.payload.status]: action.payload.hasMore,
        },
      };
    case "SET_TOTAL_COUNT_BY_STATUS":
      return { ...state, totalCountByStatus: action.payload };
    case "RESET_PAGINATION":
      return {
        ...state,
        pageByStatus: { "to-do": 0, "in-progress": 0, done: 0 },
        hasMoreByStatus: { "to-do": true, "in-progress": true, done: true },
        tasksByStatus: { "to-do": [], "in-progress": [], done: [] },
      };
    case "SET_FILTERS_CHANGED":
      return { ...state, filtersChanged: action.payload };
    case "UPDATE_SINGLE_TASK": {
      const { task } = action.payload;
      const statusKey = getStatusKey(task.status);
      if (!statusKey) return state;

      return {
        ...state,
        tasksByStatus: {
          ...state.tasksByStatus,
          [statusKey]: state.tasksByStatus[statusKey].map((t) =>
            t.id === task.id ? task : t
          ),
        },
      };
    }
    case "ADD_TASK": {
      const { task } = action.payload;
      const statusKey = getStatusKey(task.status);
      if (!statusKey) return state;

      return {
        ...state,
        tasksByStatus: {
          ...state.tasksByStatus,
          [statusKey]: [task, ...state.tasksByStatus[statusKey]],
        },
      };
    }
    case "REMOVE_TASK": {
      const { taskId, statusKey } = action.payload;
      return {
        ...state,
        tasksByStatus: {
          ...state.tasksByStatus,
          [statusKey]: state.tasksByStatus[statusKey].filter(
            (t) => t.id !== taskId
          ),
        },
      };
    }
    default:
      return state;
  }
}

const getStatusKey = (status: string): StatusKey | null => {
  const normalized = status.toLowerCase().replace(" ", "-");
  return statusKeyArray.includes(normalized as StatusKey)
    ? (normalized as StatusKey)
    : null;
};

const statusKeyToStatusLabel = (key: StatusKey) =>
  key === "to-do" ? "To Do" : key === "in-progress" ? "In Progress" : "Done";

const PAGE_SIZE = 10;

export function useTasks() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  const lastSeenCreatedAt = useRef<Record<StatusKey, string | null>>({
    "to-do": null,
    "in-progress": null,
    done: null,
  });
  
  stateRef.current = state;

  const setTasksByStatus = useCallback((val: Record<StatusKey, Task[]>) => {
    dispatch({ type: "SET_TASKS_BY_STATUS", payload: val });
  }, []);

  const setStatusFilter = useCallback((val: string | null) => {
    dispatch({ type: "SET_STATUS_FILTER", payload: val });
  }, []);

  const setCategoryFilter = useCallback((val: string | null) => {
    dispatch({ type: "SET_CATEGORY_FILTER", payload: val });
  }, []);

  const setSubcategoryFilter = useCallback((val: string | null) => {
    dispatch({ type: "SET_SUBCATEGORY_FILTER", payload: val });
  }, []);

  const setDateRange = useCallback(
    (val: { from: string | null; to: string | null }) => {
      dispatch({ type: "SET_DATE_RANGE", payload: val });
    },
    []
  );

  const setLimit = useCallback((val: number | null) => {
    dispatch({ type: "SET_LIMIT", payload: val });
  }, []);

  const setLoading = useCallback((val: boolean) => {
    dispatch({ type: "SET_LOADING", payload: val });
  }, []);

  const debouncedSearch = useMemo(
    () =>
      debounce((query: string | null) => {
        dispatch({ type: "SET_SEARCH_QUERY", payload: query });
      }, 500),
    []
  );

  const setSearchQuery = useCallback(
    (query: string | null) => {
      debouncedSearch(query);
    },
    [debouncedSearch]
  );

  const resetPagination = useCallback(() => {
    dispatch({ type: "RESET_PAGINATION" });
  }, []);

  const setTotalCountByStatus = useCallback(
    (val: Record<StatusKey, number>) => {
      dispatch({ type: "SET_TOTAL_COUNT_BY_STATUS", payload: val });
    },
    []
  );

  const setFiltersChanged = useCallback((val: boolean) => {
    dispatch({ type: "SET_FILTERS_CHANGED", payload: val });
  }, []);

  const fetchTasksByStatus = useCallback(
    async (
      status: string,
      filters: {
        categoryFilter?: string | null;
        subcategoryFilter?: string | null;
        dateRange?: { from: string | null; to: string | null };
        searchQuery?: string | null;
        limit?: number | null;
        lastSeenCreatedAt?: string | null;
      }
    ): Promise<Task[]> => {
      try {
        const effectiveLimit = filters.limit ?? PAGE_SIZE;

        const { data, error } = await supabase.rpc("get_tasks_by_status", {
          task_status: status,
          category_filter: filters.categoryFilter,
          subcategory_filter: filters.subcategoryFilter,
          date_from: filters.dateRange?.from,
          date_to: filters.dateRange?.to,
          limit_count: effectiveLimit,
          last_seen_created_at: filters.lastSeenCreatedAt,
          search_query: filters.searchQuery,
        });

        if (error) {
          console.error("Error fetching tasks:", error);
          return [];
        }

        return data as Task[];
      } catch (error) {
        console.error("Error in fetchTasksByStatus:", error);
        return [];
      }
    },
    []
  );

  const fetchStatusWiseCounts = useCallback(async () => {
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

    try {
      const countPromises = statusKeyArray.map(async (key) => {
        let query = supabase
          .from("projects")
          .select("*", { count: "exact", head: true })
          .eq("status", statusLabels[key]);

        const currentState = stateRef.current;
        if (
          !currentState.statusFilter ||
          currentState.statusFilter === statusLabels[key]
        ) {
          if (currentState.categoryFilter)
            query = query.eq("category", currentState.categoryFilter);
          if (currentState.subcategoryFilter)
            query = query.eq("subcategory", currentState.subcategoryFilter);
          if (currentState.dateRange?.from && currentState.dateRange?.to) {
            query = query
              .gte("created_at", currentState.dateRange.from)
              .lte("created_at", currentState.dateRange.to);
          }
          if (currentState.searchQuery)
            query = query.ilike("title", `%${currentState.searchQuery}%`);
        }

        const { count } = await query;
        return { key, count };
      });

      const results = await Promise.all(countPromises);
      results.forEach(({ key, count }) => {
        if (typeof count === "number") counts[key] = count;
      });

      setTotalCountByStatus(counts);
    } catch (error) {
      console.error("Error in fetchStatusWiseCounts:", error);
    }
  }, [setTotalCountByStatus]);

  const handleRealtimeUpdate = useCallback(
    (payload: any) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      if (eventType === "INSERT") {
        dispatch({
          type: "ADD_TASK",
          payload: { task: newRecord },
        });
      } else if (eventType === "UPDATE") {
        dispatch({
          type: "UPDATE_SINGLE_TASK",
          payload: { task: newRecord },
        });
      } else if (eventType === "DELETE") {
        const statusKey = getStatusKey(oldRecord.status);
        if (statusKey) {
          dispatch({
            type: "REMOVE_TASK",
            payload: { taskId: oldRecord.id, statusKey },
          });
        }
      }
    },
    []
  );

  const loadMoreTasks = useCallback(
    async (reset = false, specificStatus?: StatusKey) => {
      const currentState = stateRef.current;
      if (currentState.loading && !reset) return;

      const statuses = specificStatus ? [specificStatus] : statusKeyArray;
      setLoading(true);

      try {
        const fetchPromises = statuses.map(async (key) => {
          const label = statusKeyToStatusLabel(key);
          
          let filtered = {
            categoryFilter: null,
            subcategoryFilter: null,
            dateRange: { from: null, to: null },
            searchQuery: null,
            lastSeenCreatedAt: reset ? null : lastSeenCreatedAt.current[key],
          };

          if (!currentState.statusFilter || currentState.statusFilter === label) {
            filtered = {
              categoryFilter: currentState.categoryFilter,
              subcategoryFilter: currentState.subcategoryFilter,
              dateRange: currentState.dateRange,
              searchQuery: currentState.searchQuery,
              lastSeenCreatedAt: reset ? null : lastSeenCreatedAt.current[key],
            };
          }

          const tasks = await fetchTasksByStatus(label, {
            ...filtered,
            limit: PAGE_SIZE,
          });

          if (tasks.length > 0) {
            lastSeenCreatedAt.current[key] = tasks[tasks.length - 1].created_at;
          }

          return { key, tasks };
        });

        const results = await Promise.all(fetchPromises);

        if (reset) {
          const newTasksByStatus: Record<StatusKey, Task[]> = {
            "to-do": [],
            "in-progress": [],
            done: [],
          };

          results.forEach(({ key, tasks }) => {
            newTasksByStatus[key] = tasks;
            dispatch({
              type: "SET_HAS_MORE_BY_STATUS",
              payload: { status: key, hasMore: tasks.length === PAGE_SIZE },
            });
          });

          setTasksByStatus(newTasksByStatus);
        } else {
          results.forEach(({ key, tasks }) => {
            dispatch({
              type: "UPDATE_TASKS_FOR_STATUS",
              payload: {
                status: key,
                tasks: [
                  ...currentState.tasksByStatus[key],
                  ...tasks.filter(
                    (newTask) =>
                      !currentState.tasksByStatus[key].some(
                        (t) => t.id === newTask.id
                      )
                  ),
                ],
              },
            });
            dispatch({
              type: "SET_HAS_MORE_BY_STATUS",
              payload: { status: key, hasMore: tasks.length === PAGE_SIZE },
            });
          });
        }
      } catch (error) {
        console.error("Error in loadMoreTasks:", error);
      } finally {
        setLoading(false);
        if (reset) {
          setFiltersChanged(false);
        }
      }
    },
    [fetchTasksByStatus, setTasksByStatus, setFiltersChanged]
  );

  const findColumnOfTask = useCallback((taskId: string): StatusKey | null => {
    const currentState = stateRef.current;
    for (const key of statusKeyArray) {
      if (
        currentState.tasksByStatus[key].some(
          (task) => task.id.toString() === taskId
        )
      ) {
        return key;
      }
    }
    return null;
  }, []);

  const moveTask = useCallback(
    async (
      taskId: string,
      sourceCol: StatusKey,
      destCol: StatusKey,
      destIndex: number
    ) => {
      const currentState = stateRef.current;
      const task = currentState.tasksByStatus[sourceCol].find(
        (t) => t.id.toString() === taskId
      );
      if (!task) return;

      const newSourceTasks = currentState.tasksByStatus[sourceCol].filter(
        (t) => t.id.toString() !== taskId
      );
      const updatedTask: Task = {
        ...task,
        status: statusKeyToStatusLabel(destCol),
      };
      const newDestTasks = currentState.tasksByStatus[destCol].filter(
        (t) => t.id.toString() !== taskId
      );
      newDestTasks.splice(destIndex, 0, updatedTask);

      setTasksByStatus({
        ...currentState.tasksByStatus,
        [sourceCol]: newSourceTasks,
        [destCol]: newDestTasks,
      });

      const { error } = await supabase.rpc("update_task_status", {
        task_id: task.id,
        new_status: updatedTask.status,
      });

      if (error) console.error("Failed to update task status:", error);
      await fetchStatusWiseCounts();
    },
    [setTasksByStatus, fetchStatusWiseCounts]
  );

  useEffect(() => {
    const channel = supabase
      .channel("realtime-projects")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
        },
        handleRealtimeUpdate
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [handleRealtimeUpdate]);

  useEffect(() => {
    if (state.filtersChanged) {
      resetPagination();
      loadMoreTasks(true);
      fetchStatusWiseCounts();
    }
  }, [
    state.statusFilter,
    state.categoryFilter,
    state.subcategoryFilter,
    state.dateRange,
    state.searchQuery,
    state.limit,
    resetPagination,
    loadMoreTasks,
    fetchStatusWiseCounts,
  ]);

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
    hasMoreByStatus: state.hasMoreByStatus,
    pageByStatus: state.pageByStatus,
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