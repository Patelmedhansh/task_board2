import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import FilterBar from "../components/FilterBar";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragEndEvent,
} from "@dnd-kit/core";
import { DroppableColumn } from "../components/DroppableColumn";
import { DraggableCard } from "../components/DraggableCard";
import { useTasks } from "../hooks/useTasks";
import { Task } from "../types/tasks";

export default function Dashboard() {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userEmail, setUserEmail] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  const {
    tasksByStatus,
    setTasksByStatus,
    tasks,
    setTasks,
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
  } = useTasks();

  const columnMap: Record<string, string> = {
    "to-do": "To Do",
    "in-progress": "In Progress",
    done: "Done",
  };

  const columns = Object.keys(columnMap);

  useEffect(() => {
    resetPagination();
    loadMoreTasks(true);
    getUser();
  }, [statusFilter, categoryFilter, dateRange]);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    const handleScroll = () => {
      if (
        scrollEl &&
        scrollEl.scrollTop + scrollEl.clientHeight >=
          scrollEl.scrollHeight - 300 &&
        !loading &&
        hasMore
      ) {
        loadMoreTasks();
      }
    };
    scrollEl?.addEventListener("scroll", handleScroll);
    return () => scrollEl?.removeEventListener("scroll", handleScroll);
  }, [loading, hasMore]);

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    const sourceCol = findColumnOfTask(activeId);
    const destCol = findColumnOfTask(overId) || overId;

    if (!sourceCol || !destCol) return;

    const destinationTasks = tasksByStatus[destCol];
    let destIndex = destinationTasks.findIndex(
      (t) => t.id.toString() === overId
    );

    if (destIndex === -1) {
      destIndex = destinationTasks.length;
    }

    if (sourceCol === destCol) {
      const sourceIndex = tasksByStatus[sourceCol].findIndex(
        (t) => t.id.toString() === activeId
      );
      if (sourceIndex < destIndex) destIndex--;
    }

    await moveTask(activeId, sourceCol, destCol, destIndex);
    setActiveTask(null);
  };

  const getUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) setUserEmail(user?.email ?? "");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-16"
        }`}
      >
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          userEmail={userEmail}
          dropdownOpen={dropdownOpen}
          setDropdownOpen={setDropdownOpen}
          handleLogout={handleLogout}
        />

        <div className="flex-1 p-6 bg-gray-100 mt-20">
          <h1 className="font-bold text-2xl mb-6">Dashboard</h1>

          <div className="bg-gray-100 sticky top-20 z-10 pb-4">
            <FilterBar
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              limit={limit}
              setLimit={setLimit}
              dateRange={dateRange}
              setDateRange={setDateRange}
            />
          </div>

          <div
            className="overflow-y-auto max-h-[calc(100vh-12rem)]"
            ref={scrollRef}
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onDragEnd}
            >
              <div className="grid grid-cols-3 gap-4 mt-4">
                {columns.map((col) => (
                  <DroppableColumn
                    key={col}
                    columnId={col}
                    title={columnMap[col]}
                    tasks={tasksByStatus[col] || []}
                    setActiveTask={setActiveTask}
                  />
                ))}
              </div>
              <DragOverlay>
                {activeTask && (
                  <DraggableCard
                    task={activeTask}
                    setActiveTask={setActiveTask}
                  />
                )}
              </DragOverlay>
            </DndContext>

            {loading && (
              <p className="text-center mt-4 text-gray-500">
                Loading more tasks...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
