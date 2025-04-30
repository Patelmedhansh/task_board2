import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { DateRange } from "react-date-range";
import { useState, useEffect } from "react";
import { useRef } from "react";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

type Setter<T> = (val: T) => void;

interface FilterBarProps {
  statusFilter?: string | null;
  setStatusFilter?: Setter<string | null>;
  categoryFilter: string | null;
  setCategoryFilter: Setter<string | null>;
  subcategoryFilter: string | null;
  setSubcategoryFilter: Setter<string | null>;
  limit: number | null;
  setLimit: Setter<number | null>;
  dateRange: { from: string | null; to: string | null };
  setDateRange: Setter<{ from: string | null; to: string | null }>;
  categoryOptions: string[];
  subcategoryMap: Record<string, string[]>;
  searchQuery: string | null;
  setSearchQuery: Setter<string | null>;
}

export default function FilterBar({
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  subcategoryFilter,
  setSubcategoryFilter,
  limit,
  setLimit,
  dateRange,
  setDateRange,
  categoryOptions,
  subcategoryMap,
  searchQuery,
  setSearchQuery,
}: FilterBarProps) {
  const calendarRef = useRef<HTMLDivElement>(null);
  const [searchInput, setSearchInput] = useState(searchQuery ?? "");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [range, setRange] = useState<any[]>([
    {
      startDate: dateRange.from ? new Date(dateRange.from) : new Date(),
      endDate: dateRange.to ? new Date(dateRange.to) : new Date(),
      key: "selection",
    },
  ]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setCalendarOpen(false); // 👈 close the calendar
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (
      categoryFilter &&
      !subcategoryMap[categoryFilter]?.includes(subcategoryFilter || "")
    ) {
      if (subcategoryFilter !== null) setSubcategoryFilter(null);
    }
  }, [categoryFilter, subcategoryMap, subcategoryFilter]);

  
  useEffect(() => {
    const delay = setTimeout(() => {
      setSearchQuery(searchInput.trim() || null);
    }, 500);
  
    return () => clearTimeout(delay);
  }, [searchInput, setSearchQuery]);
  

  return (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <div className="relative">
        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
          <FontAwesomeIcon icon={faSearch} />
        </span>
        <input
          type="text"
          placeholder="Search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="border border-gray-300 pl-10 pr-4 py-2 rounded text-sm w-48 bg-white"
        />
      </div>

      {typeof statusFilter !== "undefined" &&
        typeof setStatusFilter !== "undefined" && (
          <select
            onChange={(e) => setStatusFilter(e.target.value || null)}
            className="border border-gray-300 px-3 py-2 rounded text-sm w-32 bg-white"
            value={statusFilter ?? ""}
          >
            <option value="">Status</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>
        )}

      <select
        onChange={(e) => setCategoryFilter(e.target.value || null)}
        className="border border-gray-300 px-3 py-2 rounded text-sm w-40 bg-white"
        value={categoryFilter ?? ""}
      >
        <option value="">Category</option>
        {categoryOptions.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>

      {categoryFilter && (
        <select
          onChange={(e) => setSubcategoryFilter(e.target.value || null)}
          className="border border-gray-300 px-3 py-2 rounded text-sm w-40 bg-white"
          value={subcategoryFilter ?? ""}
        >
          <option value="">Subcategory</option>
          {(subcategoryMap[categoryFilter] || []).map((sub) => (
            <option key={sub} value={sub}>
              {sub}
            </option>
          ))}
        </select>
      )}

      <div className="relative flex items-center">
        <button
          type="button"
          onClick={() => setCalendarOpen((open) => !open)}
          className="border border-gray-300 px-3 py-2 rounded text-sm w-48 text-left bg-white"
        >
          {dateRange.from && dateRange.to
            ? `${new Date(dateRange.from).toLocaleDateString()} - ${new Date(
                dateRange.to
              ).toLocaleDateString()}`
            : "Date Range"}
        </button>
        {dateRange.from && dateRange.to && (
          <button
            className="text-gray-400 hover:text-red-500 text-lg px-1 focus:outline-none"
            title="Clear date filter"
            type="button"
            onClick={() => {
              setDateRange({ from: null, to: null });
              setRange([
                {
                  startDate: new Date(),
                  endDate: new Date(),
                  key: "selection",
                },
              ]);
            }}
          >
            &times;
          </button>
        )}
        {calendarOpen && (
          <div ref={calendarRef} className="absolute left-0 top-full mt-2 bg-white rounded-md shadow-lg border border-gray-200 z-50">
            <DateRange
              ranges={range}
              onChange={(item) => {
                const start = item.selection.startDate?.toISOString();
                const end = item.selection.endDate?.toISOString();
                if (start && end) {
                  setRange([item.selection]);
                  setDateRange({ from: start, to: end });
                }
              }}
              moveRangeOnFirstSelection={false}
              editableDateInputs={true}
              showDateDisplay={false}
              rangeColors={["#f97316"]}
              direction="horizontal"
            />
          </div>
        )}
      </div>

      <select
        onChange={(e) => setLimit(Number(e.target.value) || null)}
        className="border border-gray-300 px-3 py-2 rounded text-sm w-32 bg-white"
        value={limit ?? ""}
      >
        <option value="">Limit</option>
        <option value="10">10</option>
        <option value="20">20</option>
        <option value="30">30</option>
      </select>
    </div>
  );
}
