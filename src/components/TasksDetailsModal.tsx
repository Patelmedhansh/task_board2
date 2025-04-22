import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Dialog, DialogPanel, Transition } from "@headlessui/react";

interface TaskDetailsModalProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_email: string;
}

export default function TaskDetailsModal({
  taskId,
  isOpen,
  onClose,
}: TaskDetailsModalProps) {
  const [task, setTask] = useState<any>(null);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (taskId && isOpen) {
      fetchTaskDetails();
      fetchComments();
    }
  }, [taskId, isOpen]);

  const fetchTaskDetails = async () => {
    const { data, error } = await supabase.rpc("get_task_details", {
      task_id: taskId,
    });
    if (!error && data && data.length > 0) setTask(data[0]);
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    const { error } = await supabase
      .from("projects")
      .update({ status: newStatus })
      .eq("id", taskId);
  
    if (!error) {
      setTask((prev: any) => ({ ...prev, status: newStatus }));
    } else {
      console.error("Failed to update status", error);
    }
  };
  

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("comments")
      .select("id, content, created_at, user_email")
      .eq("task_id", taskId)
      .order("created_at", { ascending: false });

    if (!error && data) setComments(data);
  };

  const handleAddComment = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase.from("comments").insert([
      {
        task_id: taskId,
        content: comment,
        user_email: user?.email || "Anonymous",
      },
    ]);

    if (!error) {
      setComment("");
      fetchComments();
    }
    setLoading(false);
  };

  if (!task) return null;

  return (
    <Transition appear show={isOpen}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 backdrop-blur-sm" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.5)] p-6 w-full max-w-5xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">{task.title}</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-black"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-1">Description</h3>
                <div className="text-sm text-gray-700 whitespace-pre-line mb-4 max-h-40 overflow-y-auto border rounded p-2">
                  {task.description}
                </div>

                <h4 className="font-semibold mb-2">Comments</h4>
                <textarea
                  className="w-full border rounded p-2 text-sm mb-2"
                  placeholder="Add Comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    className="bg-red-500 text-white px-4 py-1 rounded text-sm"
                    onClick={handleAddComment}
                    disabled={loading || !comment.trim()}
                  >
                    Save
                  </button>
                  <button
                    className="text-sm text-gray-600 hover:text-black"
                    onClick={() => setComment("")}
                  >
                    Cancel
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {comments.map((c) => (
                    <div key={c.id} className="border rounded p-2">
                      <div className="text-sm text-gray-800">
                        {c.user_email}
                      </div>
                      <p className="text-sm text-gray-600 whitespace-pre-line">
                        {c.content}
                      </p>
                      <span className="text-xs text-gray-400">
                        {new Date(c.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border space-y-2">
                <h3 className="font-semibold">Details</h3>
                <div className="flex items-center gap-2">
                  <strong>Status:</strong>
                  <select
                    value={task.status}
                    onChange={handleStatusChange}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                    <option value="Discarded">Discarded</option>
                  </select>
                </div>

                <p>
                  <strong>Amount Raw Value:</strong> {task.amount_rawValue}
                </p>
                <p>
                  <strong>Amount Display Value:</strong>{" "}
                  {task.amount_displayValue}
                </p>
                <p>
                  <strong>Hourly Budget Type:</strong> {task.hourlyBudgetType}
                </p>
                <p>
                  <strong>Hourly Budget Min:</strong>{" "}
                  {task.hourlyBudgetMin_rawValue}
                </p>
                <p>
                  <strong>Hourly Budget Max:</strong>{" "}
                  {task.hourlyBudgetMax_rawValue}
                </p>
                <p>
                  <strong>Total Applicants:</strong> {task.totalApplicants}
                </p>
              </div>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </Transition>
  );
}
