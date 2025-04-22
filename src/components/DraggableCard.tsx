import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "../types/tasks";

interface DraggableCardProps {
  task: Task;
  setActiveTask: (task: Task) => void;
  onClick?: () => void;
}

export function DraggableCard({ task, setActiveTask, onClick }: DraggableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id.toString(),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className="border border-gray-300 p-5 rounded shadow hover:shadow-md cursor-pointer bg-white"
      onMouseDown={() => {
        setActiveTask(task);
        if (onClick) onClick();
      }} 
    >
      <h2 className="font-semibold line-clamp-1 pb-2">{task.title}</h2>
      <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
    </div>
  );
}
