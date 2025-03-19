export interface User {
  id: string;
  auth_id: string;
  name: string;
  region: string;
  subjects: string[];
  avatar_name: string;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  subject_name: string;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: string;
  subject_id: string;
  module_name: string;
  order_index: number;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  module_id: string;
  session_name: string;
  content: {
    type: string;
    content: any;
  };
  created_at: string;
  updated_at: string;
}

export type { Quiz, QUIZ_TYPES } from '../config/const';