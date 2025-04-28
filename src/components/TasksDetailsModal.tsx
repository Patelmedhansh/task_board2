import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Dialog, DialogPanel, Transition } from "@headlessui/react";
import { toast } from "react-hot-toast";
import { Comment } from "../types/comments";
import { askAIForTask } from "../services/aiSuggestions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";

interface TaskDetailsModalProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: () => void;
}

export default function TaskDetailsModal({
  taskId,
  isOpen,
  onClose,
  onStatusChange,
}: TaskDetailsModalProps) {
  const [task, setTask] = useState<any>(null);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>("");
  // const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(
  //   null
  // );
  // const [replyContent, setReplyContent] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);

  const handleAskAI = async () => {
    setAiLoading(true);
    try {
      const suggestion = await askAIForTask(task);
      setAiAnswer(suggestion);
    } catch (e) {
      toast.error("AI suggestion failed");
    } finally {
      setAiLoading(false);
    }
  };

  const handleCloseSuggestion = () => setAiAnswer(null);

  useEffect(() => {
    if (taskId && isOpen) {
      fetchTaskDetails();
      fetchComments();
    }
  }, [taskId, isOpen]);

  useEffect(() => {
    if (!taskId || !isOpen) return;
  
    const channel = supabase
      .channel('realtime-comments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
        },
        (payload) => {
          if (payload.eventType === "INSERT" && payload.new?.task_id == taskId ||
            payload.eventType === "UPDATE" && payload.new?.task_id == taskId ||
            payload.eventType === "DELETE") {
            fetchComments();
            return;
          }
          const affectedTaskId =
            (payload.new as any)?.task_id || (payload.old as any)?.task_id;
          if (affectedTaskId === taskId) {
            fetchComments();
          }
        }
      )
      .subscribe();
  
    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId, isOpen]);

  useEffect(() => {
    if (!taskId || !isOpen) return;
  
    const channel = supabase
      .channel('realtime-task-details')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${taskId}`,
        },
        () => {
          fetchTaskDetails();
        }
      )
      .subscribe();
  
    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId, isOpen]);
  

  const fetchTaskDetails = async () => {
    const { data, error } = await supabase.rpc("get_task_details", {
      task_id: taskId,
    });
    if (!error && data && data.length > 0) setTask(data[0]);
  };

  const handleStatusChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newStatus = e.target.value;
    const { error } = await supabase
      .from("projects")
      .update({ status: newStatus })
      .eq("id", taskId);
  
    if (!error) {
      setTask((prev: any) => ({ ...prev, status: newStatus }));
      toast.success("Status updated!");
      if (onStatusChange) onStatusChange();
    } else {
      toast.error("Failed to update status");
    }
  };

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("comments")
      .select("id, content, created_at, user_email, parent_id")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (!error && data) setComments(data);
  };

  const handleAddComment = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("comments").insert([
      {
        task_id: taskId,
        content: comment,
        user_email: user?.email || "Anonymous",
        parent_id: null,
      },
    ]);

    if (!error) {
      setComment("");
      toast.success("Comment added!");
      fetchComments();
    } else {
      toast.error("Failed to add comment");
    }
    setLoading(false);
  };

  const handleDeleteComment = async (id: string) => {
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (!error) {
      toast.success("Comment deleted");
      fetchComments();
    } else {
      toast.error("Failed to delete comment");
    }
  };

  const handleStartEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
    // setReplyingToCommentId(null);
  };

  const handleSaveEdit = async (id: string) => {
    const { error } = await supabase
      .from("comments")
      .update({ content: editingContent })
      .eq("id", id);
    if (!error) {
      toast.success("Comment updated!");
      setEditingCommentId(null);
      setEditingContent("");
      fetchComments();
    } else {
      toast.error("Failed to update comment");
    }
  };

  // const handleStartReply = (id: string) => {
  //   setReplyingToCommentId(id);
  //   setReplyContent("");
  //   setEditingCommentId(null);
  // };

  // const handleReply = async (parent_id: string) => {
  //   setLoading(true);
  //   const {
  //     data: { user },
  //   } = await supabase.auth.getUser();

  //   const { error } = await supabase.from("comments").insert([
  //     {
  //       task_id: taskId,
  //       content: replyContent,
  //       user_email: user?.email || "Anonymous",
  //       parent_id,
  //     },
  //   ]);

  //   if (!error) {
  //     toast.success("Reply added!");
  //     setReplyingToCommentId(null);
  //     setReplyContent("");
  //     fetchComments();
  //   } else {
  //     toast.error("Failed to add reply");
  //   }
  //   setLoading(false);
  // };

  const renderComments = (parentId: string | null = null) =>
    comments
      .filter((c) => c.parent_id === parentId)
      .map((c) => (
        <div key={c.id} className="rounded p-2 mt-2">
          <div className="text-sm font-semibold">{c.user_email}</div>
          {editingCommentId === c.id ? (
            <div>
              <textarea
                className="w-full border rounded p-2 text-sm mb-1"
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  className="bg-blue-500 text-white px-3 py-1 rounded text-xs"
                  onClick={() => handleSaveEdit(c.id)}
                  disabled={editingContent.trim() === ""}
                >
                  Save
                </button>
                <button
                  className="text-xs text-gray-600 hover:text-black"
                  onClick={() => setEditingCommentId(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {c.content}
              </p>
              <span className="text-xs text-gray-400">
                {new Date(c.created_at).toLocaleString()}
              </span>
              <div className="mt-1 flex gap-2 text-xs">
                {/* <button
                  className="hover:underline"
                  onClick={() => handleStartReply(c.id)}
                >
                  Reply
                </button> */}
                <button
                  className="hover:underline"
                  onClick={() => handleStartEdit(c)}
                >
                  Edit
                </button>
                <button
                  className="hover:underline"
                  onClick={() => handleDeleteComment(c.id)}
                >
                  Delete
                </button>
              </div>
            </>
          )}

          {/* {replyingToCommentId === c.id && (
            <div className="mt-2">
              <textarea
                className="w-full border rounded p-2 text-sm mb-1"
                value={replyContent}
                placeholder="Write a reply..."
                onChange={(e) => setReplyContent(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  className="bg-blue-500 text-white px-3 py-1 rounded text-xs"
                  onClick={() => handleReply(c.id)}
                  disabled={replyContent.trim() === ""}
                >
                  Reply
                </button>
                <button
                  className="text-xs text-gray-600 hover:text-black"
                  onClick={() => setReplyingToCommentId(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )} */}

          <div className="pl-6">{renderComments(c.id)}</div>
        </div>
      ));

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
            <div className="grid grid-cols-3 gap-6 items-start">
              <div className="col-span-2">
                <h3 className="font-semibold mb-1">Description</h3>
                <div className="text-sm text-gray-700 whitespace-pre-line mb-4 max-h-40 overflow-y-auto border border-gray-300 rounded p-2">
                  {task.description}
                </div>
                <button
                  onClick={handleAskAI}
                  disabled={aiLoading}
                  className="mt-4 mb-1 flex items-center gap-2 font-semibold border border-orange-600 rounded text-orange-600 pl-3 pr-3 pt-1 pb-1 hover:text-white hover:bg-orange-600"
                >
                  <FontAwesomeIcon icon={faEye} />{" "}
                  {aiLoading ? "Generating..." : "Write with AI"}
                </button>
                {aiAnswer && (
                  <div className="relative rounded border border-gray-300 p-3 text-sm leading-6 mb-4">
                    <button
                      onClick={handleCloseSuggestion}
                      className="absolute top-2 right-2 text-gray-400 hover:text-black text-sm"
                      aria-label="Close suggestion"
                    >
                      &times;
                    </button>
                    <h4 className="mb-2 font-semibold">AI suggestion</h4>
                    <p className="text-gray-700 text-sm whitespace-pre-line">
                      {aiAnswer}
                    </p>
                  </div>
                )}
                <h4 className="font-semibold mt-4 mb-2">Comments</h4>
                <textarea
                  className="w-full border border-gray-300 rounded p-2 text-sm mb-2"
                  placeholder="Add Comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    className="bg-orange-600 text-white px-4 py-1 rounded text-sm"
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
                <div className="mt-4 space-y-3">{renderComments()}</div>
              </div>

              <div className="col-span-1">
                <h3 className="font-semibold mb-4">Details</h3>
                <div className="bg-white rounded-lg border border-gray-200 px-6 py-5 w-full max-w-xs ml-auto">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-medium text-base">Status</span>
                    <select
                      value={task.status}
                      onChange={handleStatusChange}
                      className="border border-gray-300 rounded-lg px-3 py-1 text-sm font-medium focus:outline-none"
                      style={{ minWidth: 110 }}
                    >
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                      <option value="Discarded">Discarded</option>
                    </select>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between gap-x-12">
                      <span className="mr-8">Amount Raw Value</span>
                      <span className="font-normal">
                        {task.amount_rawValue}
                      </span>
                    </div>
                    <div className="flex justify-between gap-x-12">
                      <span className="mr-8">Amount Display Value</span>
                      <span className="font-normal">
                        {task.amount_displayValue}
                      </span>
                    </div>
                    <div className="flex justify-between gap-x-12">
                      <span className="mr-8">Hourly Budget Type</span>
                      <span className="font-normal">
                        {task.hourlyBudgetType}
                      </span>
                    </div>
                    <div className="flex justify-between gap-x-12">
                      <span className="mr-8">Hourly Budget Min Value</span>
                      <span className="font-normal">
                        {task.hourlyBudgetMin_rawValue}
                      </span>
                    </div>
                    <div className="flex justify-between gap-x-12">
                      <span className="mr-8">Hourly Budget Max Value</span>
                      <span className="font-normal">
                        {task.hourlyBudgetMax_rawValue}
                      </span>
                    </div>
                    <div className="flex justify-between gap-x-12">
                      <span className="mr-8">Total Applicant</span>
                      <span className="font-normal">
                        {task.totalApplicants}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </Transition>
  );
}
