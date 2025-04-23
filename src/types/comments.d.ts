export interface Comment {
    id: string;
    content: string;
    created_at: string;
    user_email: string;
    parent_id?: string | null;
  }