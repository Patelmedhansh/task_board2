export interface Comment {
    id: string;
    content: string;
    created_at: string;
    user_email: string;
    user_id: string;
    parent_id?: string | null;
    updated_at?: string | null; 
  }