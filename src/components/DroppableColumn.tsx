import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import NoTask from "../assets/img/notask.png";
import { DraggableCard } from "./DraggableCard";
import { Task } from "../types/tasks";
import { StatusKey } from "../hooks/useTasks";

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
  totalCount,
}: DroppableColumnProps) {
  const { setNodeRef } = useDroppable({ id: columnId });

  const sortableItems = tasks.map((task) => task.id.toString());

  return (
    <div className="bg-white rounded-lg shadow px-4 flex flex-col w-full">
      <div className="sticky top-[0px] bg-white p-2 font-semibold flex items-center">
        <span
          className={`w-3 h-3 rounded-full mr-2 ${
            columnId === "to-do"
              ? "bg-yellow-500"
              : columnId === "in-progress"
              ? "bg-blue-500"
              : "bg-green-500"
          }`}
        />
        {title} ({Math.min(tasks.length, totalCount)} of {totalCount})
      </div>

      <div ref={setNodeRef} className="mt-2 space-y-3">
        <SortableContext
          items={sortableItems}
          strategy={verticalListSortingStrategy}
        >
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <img src={NoTask} alt="No Task" className="h-32 w-32 mb-2" />
              <span>No Task</span>
            </div>
          ) : (
            tasks.slice(0, totalCount).map((task) => (
              <DraggableCard
                key={task.id.toString()}
                task={task}
                setActiveTask={setActiveTask}
                onClick={() => onCardClick?.(task.id)}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}