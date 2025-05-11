import { useReducer } from "react";
import { Task } from "../types/tasks";
import { StatusKey } from "./useTasks";

export type State = {
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
};

export type Action =
  | { type: "SET_TASKS_BY_STATUS"; payload: Record<StatusKey, Task[]> }
  | { type: "SET_STATUS_FILTER"; payload: string | null }
  | { type: "SET_CATEGORY_FILTER"; payload: string | null }
  | { type: "SET_SUBCATEGORY_FILTER"; payload: string | null }
  | { type: "SET_DATE_RANGE"; payload: { from: string | null; to: string | null } }
  | { type: "SET_LIMIT"; payload: number | null }
  | { type: "SET_PAGE_BY_STATUS"; payload: { status: StatusKey; page: number } }
  | { type: "SET_HAS_MORE_BY_STATUS"; payload: { status: StatusKey; hasMore: boolean } }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_SEARCH_QUERY"; payload: string | null }
  | { type: "SET_TOTAL_COUNT_BY_STATUS"; payload: Record<StatusKey, number> }
  | { type: "RESET_PAGINATION" };

const initialState: State = {
  tasksByStatus: { "to-do": [], "in-progress": [], done: [] },
  statusFilter: null,
  categoryFilter: null,
  subcategoryFilter: null,
  dateRange: { from: null, to: null },
  limit: null,
  loading: false,
  searchQuery: null,
  pageByStatus: { "to-do": 0, "in-progress": 0, done: 0 },
  hasMoreByStatus: { "to-do": true, "in-progress": true, done: true },
  totalCountByStatus: { "to-do": 0, "in-progress": 0, done: 0 },
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
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload };
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
    default:
      return state;
  }
}

export function useTaskReducer() {
  const [state, dispatch] = useReducer(reducer, initialState);
  return { state, dispatch };
}
