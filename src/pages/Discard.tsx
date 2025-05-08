import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import FilterBar from "../components/FilterBar";
import { Task } from "../types/tasks";
import TaskDetailsModal from "../components/TasksDetailsModal";
import LogoutConfirmDialog from "../components/Logout";
import { useLoader } from "../context/LoaderContext";

export default function Discard() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [discardedTasks, setDiscardedTasks] = useState<Task[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [subcategoryFilter, setSubcategoryFilter] = useState<string | null>(
    null
  );
  const [dateRange, setDateRange] = useState<{
    from: string | null;
    to: string | null;
  }>({ from: null, to: null });
  const [limit, setLimit] = useState<number | null>(null);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [subcategoryMap, setSubcategoryMap] = useState<
    Record<string, string[]>
  >({});
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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

  useEffect(() => {
    fetchDiscardedTasks();
    getUser();
    fetchCategoryData();
  }, [categoryFilter, subcategoryFilter, dateRange, limit, searchQuery]);

  useEffect(() => {
    const channel = supabase
      .channel("realtime-discarded-projects")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
        },
        (payload) => {
          const status =
            (payload.new as any)?.status || (payload.old as any)?.status;
          if (status === "Discarded") {
            fetchDiscardedTasks();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleStatusChange = () => {
    fetchDiscardedTasks();
  };

  const getUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) setUserEmail(user.email ?? "");
  };

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

  const fetchDiscardedTasks = async () => {
    setLoading(true);

    let query = supabase.from("projects").select("*").eq("status", "Discarded");

    if (categoryFilter) query = query.eq("category", categoryFilter);
    if (subcategoryFilter) query = query.eq("subcategory", subcategoryFilter);
    if (dateRange.from) query = query.gte("created_at", dateRange.from);
    if (dateRange.to) query = query.lte("created_at", dateRange.to);
    if (searchQuery) query = query.ilike("title", `%${searchQuery}%`);
    if (limit) query = query.limit(limit);

    const { data, error } = await query;

    if (!error && data) {
      setDiscardedTasks(data);
    }

    setLoading(false);
  };

  const handleLogout = () => setShowLogoutConfirm(true);
  const confirmLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div
      className={`flex h-screen ${
        sidebarOpen ? "overflow-hidden" : "overflow-x-auto"
      }`}
    >
      <Sidebar
        sidebarOpen={sidebarOpen}
        userEmail={userEmail}
        setSidebarOpen={setSidebarOpen}
        handleLogout={handleLogout}
      />
      <div
        className={`flex-1 flex flex-col transition-all duration-300
    ${
      sidebarOpen && window.innerWidth >= 768
        ? "ml-64"
        : window.innerWidth >= 768
        ? "ml-16"
        : ""
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

        <div className="flex-1 flex flex-col p-6 bg-gray-100 mt-10 min-h-0">
          <h1 className="font-bold text-2xl mb-6">Discard</h1>

          <div className="bg-gray-100 sticky top-20 z-10 pb-4">
            <FilterBar
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

          <div className="bg-white rounded-lg shadow p-4 mt-4 flex flex-col flex-1 min-h-0">
            <div className="font-semibold mb-4 flex items-center text-red-500">
              <span className="w-3 h-3 bg-red-500 rounded-full mr-2" />
              Discard
            </div>

            <div className="space-y-3 overflow-y-auto pr-2 flex-1 min-h-0">
              {discardedTasks.map((task) => (
                <div
                  key={task.id}
                  className="border border-gray-300 p-4 rounded bg-white shadow-sm cursor-pointer hover:shadow"
                  onClick={() => {
                    setSelectedTaskId(task.id.toString());
                    setModalOpen(true);
                  }}
                >
                  <h2 className="font-semibold">{task.title}</h2>
                  <p className="text-sm text-gray-600 line-clamp-1">
                    {task.description}
                  </p>
                </div>
              ))}
              {selectedTaskId && (
                <TaskDetailsModal
                  taskId={selectedTaskId}
                  isOpen={modalOpen}
                  onClose={() => setModalOpen(false)}
                  onStatusChange={handleStatusChange}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      {sidebarOpen && (
        <div
          className="fixed inset-0 backdrop-blur-sm z-30 sm:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <LogoutConfirmDialog
        isOpen={showLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
      />
    </div>
  );
}
