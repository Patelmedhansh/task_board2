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
import TaskDetailsModal from "../components/TasksDetailsModal";
import LogoutConfirmDialog from "../components/Logout";
import { useLoader } from "../context/LoaderContext";

export default function Dashboard() {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [subcategoryMap, setSubcategoryMap] = useState<
    Record<string, string[]>
  >({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const {
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
    statusKeyArray,
  } = useTasks();

  const { setLoading } = useLoader();
  const [sidebarOpen, setSidebarOpen] = useState(
    () => window.innerWidth >= 768
  );

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  type StatusKey = (typeof statusKeyArray)[number];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const columnMap: Record<StatusKey, string> = {
    "to-do": "To Do",
    "in-progress": "In Progress",
    done: "Done",
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      resetPagination();
      await loadMoreTasks(true);
      await fetchStatusWiseCounts();
      await getUser();
      setLoading(false);
    };

    init();
  }, [
    statusFilter,
    categoryFilter,
    subcategoryFilter,
    dateRange,
    searchQuery,
    limit,
  ]);

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
  }, [loading, hasMore, loadMoreTasks]);

  useEffect(() => {
    const fetchCategoryData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("projects")
        .select("category, subcategory");

      if (!error && data) {
        const map: Record<string, string[]> = {};
        const categories = new Set<string>();

        data.forEach((row) => {
          if (!row.category) return;
          categories.add(row.category);
          if (!map[row.category]) map[row.category] = [];
          if (row.subcategory && !map[row.category].includes(row.subcategory)) {
            map[row.category].push(row.subcategory);
          }
        });

        setCategoryOptions(Array.from(categories));
        setSubcategoryMap(map);
      }

      setLoading(false);
    };

    fetchCategoryData();
  }, []);

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setIsDragging(false);

    if (!over || active.id === over.id) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    const sourceCol = findColumnOfTask(activeId) as StatusKey | null;
    const destCol =
      (findColumnOfTask(overId) as StatusKey | null) || (over.id as StatusKey);

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

    setLoading(true); // ✅ Start global loading
    await moveTask(activeId, sourceCol, destCol, destIndex);
    await fetchStatusWiseCounts(); // Optional: keep after move
    setLoading(false); // ✅ End global loading

    setActiveTask(null);
  };

  const getUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) setUserEmail(user?.email ?? "");
  };

  const handleLogout = () => setShowLogoutConfirm(true);
  const confirmLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="flex h-screen">
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

        <div className="flex-1 flex flex-col p-6 bg-gray-100 mt-20 min-h-0">
          <h1 className="font-bold text-2xl mb-2">Dashboard</h1>

          <div className="bg-gray-100 sticky top-20 z-10 pb-4">
            <FilterBar
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              subcategoryFilter={subcategoryFilter}
              setSubcategoryFilter={setSubcategoryFilter}
              limit={limit}
              setLimit={setLimit}
              dateRange={dateRange}
              setDateRange={setDateRange}
              categoryOptions={categoryOptions}
              subcategoryMap={subcategoryMap}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          </div>

          <div className="flex-1 overflow-y-auto min-h-0" ref={scrollRef}>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={(event) => {
                setIsDragging(true);
                const activeId = event.active.id.toString();
                const col = findColumnOfTask(activeId);
                if (col) {
                  const task = tasksByStatus[col].find(
                    (t) => t.id.toString() === activeId
                  );
                  setActiveTask(task || null);
                }
              }}
              onDragEnd={onDragEnd}
              onDragCancel={() => {
                setIsDragging(false);
                setActiveTask(null);
              }}
            >
              <div className="flex md:grid md:grid-cols-3 gap-4 mt-4 overflow-x-auto min-w-full">
                {statusKeyArray.map((col: StatusKey) => (
                  <DroppableColumn
                    key={col}
                    columnId={col}
                    title={columnMap[col]}
                    tasks={tasksByStatus[col]}
                    totalCount={totalCountByStatus[col]}
                    setActiveTask={setActiveTask}
                    isDragging={isDragging}
                    onCardClick={(id) => {
                      setSelectedTaskId(id);
                      setModalOpen(true);
                    }}
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
            {selectedTaskId && (
              <TaskDetailsModal
                taskId={selectedTaskId}
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onStatusChange={(updatedTask) => {
                  if (!updatedTask) return;

                  const updated = { ...tasksByStatus };
                  for (const key of statusKeyArray) {
                    updated[key] = updated[key].filter(
                      (t) => t.id !== updatedTask.id
                    );
                  }

                  const newStatus = updatedTask.status
                    .toLowerCase()
                    .replace(" ", "-");
                  if (statusKeyArray.includes(newStatus as any)) {
                    updated[newStatus as StatusKey].unshift(updatedTask);
                  }

                  setTasksByStatus(updated);
                }}
              />
            )}
          </div>
        </div>
      </div>

      <LogoutConfirmDialog
        isOpen={showLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
      />
    </div>
  );
}
