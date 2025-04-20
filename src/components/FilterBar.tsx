import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { DateRange } from "react-date-range";
import { Dispatch, SetStateAction, useState } from "react";

interface FilterBarProps {
  statusFilter: string | null;
  setStatusFilter: Dispatch<SetStateAction<string | null>>;
  categoryFilter: string | null;
  setCategoryFilter: Dispatch<SetStateAction<string | null>>;
  limit: number | null;
  setLimit: Dispatch<SetStateAction<number | null>>;
  dateRange: { from: string | null; to: string | null };
  setDateRange: Dispatch<SetStateAction<{ from: string | null; to: string | null }>>;
}

export default function FilterBar({
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  limit,
  setLimit,
  dateRange,
  setDateRange,
}: FilterBarProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [range, setRange] = useState<any[]>([
    {
      startDate: dateRange.from ? new Date(dateRange.from) : new Date(),
      endDate: dateRange.to ? new Date(dateRange.to) : new Date(),
      key: "selection",
    },
  ]);

  return (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <div className="relative">
        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
          <FontAwesomeIcon icon={faSearch} />
        </span>
        <input
          type="text"
          placeholder="Search"
          className="border border-gray-300 pl-10 pr-4 py-2 rounded text-sm w-48 bg-white"
        />
      </div>

      <select
        onChange={(e) => setStatusFilter(e.target.value || null)}
        className="border border-gray-300 px-3 py-2 rounded text-sm w-32 bg-white"
        value={statusFilter ?? ""}
      >
        <option value="">Status</option>
        <option value="To Do">To Do</option>
        <option value="In Progress">In Progress</option>
        <option value="Done">Done</option>
        <option value="Discarded">Discarded</option>
      </select>

      <select
        onChange={(e) => setCategoryFilter(e.target.value || null)}
        className="border border-gray-300 px-3 py-2 rounded text-sm w-32 bg-white"
        value={categoryFilter ?? ""}
      >
        <option value="">Category</option>
        <option value="Bug">Bug</option>
        <option value="Feature">Feature</option>
      </select>

      <div className="relative">
        <button
          onClick={() => setCalendarOpen(!calendarOpen)}
          className="border border-gray-300 px-3 py-2 rounded text-sm w-48 text-left bg-white"
        >
          {range[0].startDate.toLocaleDateString()} - {range[0].endDate.toLocaleDateString()}
        </button>
        {calendarOpen && (
          <div className="absolute z-50 mt-2 shadow-lg">
            <DateRange
              editableDateInputs={true}
              onChange={(item) => {
                const start = item.selection.startDate?.toISOString();
                const end = item.selection.endDate?.toISOString();
                if (start && end) {
                  setRange([item.selection]);
                  setDateRange({ from: start, to: end });
                }
              }}
              moveRangeOnFirstSelection={false}
              ranges={range}
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
        <option value="5">5</option>
        <option value="10">10</option>
        <option value="20">20</option>
      </select>
    </div>
  );
}
