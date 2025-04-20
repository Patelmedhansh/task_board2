export interface Task {
    id: string;
    title: string;
    description: string;
    status: string; 
    [key: string]: any;
  }
  