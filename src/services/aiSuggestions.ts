import { supabase } from "../supabaseClient";
import { Task } from "../types/tasks";

export async function askAIForTask(task: Task): Promise<string> {
  const { data, error } = await supabase.functions.invoke("ai-suggest", {
    body: { task },
  });
  if (error) throw error;
  return data.suggestion as string;
}
