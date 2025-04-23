import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import NoTask from "../assets/notask.png";
import { DraggableCard } from "./DraggableCard";
import { Task } from "../types/tasks";
import { StatusKey } from "../hooks/useTasks"; // <-- import StatusKey

interface DroppableColumnProps {
  columnId: StatusKey;
  title: string;
  tasks: Task[];
  setActiveTask: (task: Task) => void;
  onCardClick?: (taskId: string) => void;
  wasDragging?: boolean;
  isDragging?: boolean;
  totalCount: number;
}

export function DroppableColumn({
  columnId,
  title,
  tasks,
  setActiveTask,
  onCardClick,
  isDragging = false,
  totalCount,
}: DroppableColumnProps) {
  const { setNodeRef } = useDroppable({ id: columnId });

  return (
    <div
      ref={setNodeRef}
      className="bg-white rounded-lg shadow p-4 min-h-[300px] flex flex-col justify-between"
    >
      <div>
        <div className="font-semibold mb-2 flex items-center">
          <span
            className={`w-3 h-3 rounded-full mr-2 ${
              columnId === "to-do"
                ? "bg-yellow-500"
                : columnId === "in-progress"
                ? "bg-blue-500"
                : "bg-green-500"
            }`}
          />
          {title} ({tasks.length} of {totalCount})
        </div>

        <SortableContext
          items={tasks.map((task) => task.id.toString())}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <img src={NoTask} alt="No Task" className="h-32 w-32 mb-2" />
                <span>No Task</span>
              </div>
            ) : (
              tasks.map((task) => (
                <DraggableCard
                  key={`${columnId}-${task.id}`}
                  task={task}
                  setActiveTask={setActiveTask}
                  onClick={() => {
                    if (!isDragging) {
                      onCardClick?.(task.id);
                    }
                  }}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
