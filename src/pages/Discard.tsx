import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import FilterBar from "../components/FilterBar";
import { Task } from "../types/tasks";

export default function Discard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [discardedTasks, setDiscardedTasks] = useState<Task[]>([]);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [limit, setLimit] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<{ from: string | null; to: string | null }>({ from: null, to: null });

  useEffect(() => {
    fetchDiscardedTasks();
    getUser();
  }, [statusFilter, categoryFilter, dateRange, limit]);

  const getUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) setUserEmail(user.email ?? "");
  };

  const fetchDiscardedTasks = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("status", "Discarded")
      .limit(limit ?? 1000);

    if (!error && data) {
      setDiscardedTasks(data);
    }
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
          <h1 className="font-bold text-2xl mb-6">Discard</h1>

          {/* Reused FilterBar */}
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

          {/* Discarded Task List */}
          <div className="bg-white rounded-lg shadow p-4 mt-4">
            <div className="font-semibold mb-4 flex items-center text-red-500">
              <span className="w-3 h-3 bg-red-500 rounded-full mr-2" />
              Discard
            </div>

            <div className="space-y-3">
              {discardedTasks.map((task) => (
                <div
                  key={task.id}
                  className="border border-gray-300 p-4 rounded bg-white shadow-sm"
                >
                  <h2 className="font-semibold">{task.title}</h2>
                  <p className="text-sm text-gray-600">
                    {task.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
