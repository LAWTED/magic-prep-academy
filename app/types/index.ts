export interface UserXP {
  id: string;
  user_id: string;
  total_xp: number;
  streak_days: number;
  created_at: string;
  updated_at: string;
}

export interface UserHearts {
  id: string;
  user_id: string;
  current_hearts: number;
  max_hearts: number;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: string;
  subject_id: string;
  module_name: string;
  order_index: number;
  description: string;
}

export interface Subject {
  id: string;
  subject_name: string;
}

export interface ModuleProgress {
  module_id: string;
  progress: string;
  score: number;
}

export interface ModuleWithSubject extends Module {
  subject_name: string;
}

export interface Award {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_path: string;
  is_purchasable: boolean;
};

export interface UserAward {
  id: string;
  user_id: string;
  award_id: string;
  acquired_at: string;
};