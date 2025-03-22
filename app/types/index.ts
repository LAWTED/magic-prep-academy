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
}

export interface UserAward {
  id: string;
  user_id: string;
  award_id: string;
  acquired_at: string;
}

export interface Session {
  id: string;
  module_id: string;
  session_name: string;
  content: {
    type: string;
    content: any;
  };
}

export interface SessionProgress {
  session_id: string;
  progress: string;
  score: number;
}

export interface Module {
  id: string;
  subject_id: string;
  module_name: string;
  description: string;
}

export interface School {
  id: string;
  name: string;
  location: string;
}

export interface Program {
  id: string;
  school_id: string;
  subject_id: string;
  name: string;
}

export interface Subject {
  id: string;
  subject_name: string;
}

export interface SchoolWithPrograms extends School {
  programs: (Program & { subject_name: string })[];
}

export interface UserAcademic {
  id: string;
  user_id: string;
  content: {
    gpa?: {
      score?: number;
      wes?: Record<string, any>;
    };
    gre?: {
      verbal?: number;
      quantitative?: number;
      analytical?: number;
      total?: number;
    };
    languageScore?: {
      toefl?: {
        reading?: number;
        writing?: number;
        speaking?: number;
        listening?: number;
        total?: number;
      };
      ielts?: {
        reading?: number;
        writing?: number;
        speaking?: number;
        listening?: number;
        overall?: number;
      };
      duolingo?: {
        score?: number;
      };
    };
  };
  created_at: string;
  updated_at: string;
}

export interface ResumeAnalysisData {
  scores: {
    content: {
      score: number;
      feedback: string;
    };
    quality: {
      score: number;
      feedback: string;
    };
    impact: {
      score: number;
      feedback: string;
    };
    clarity: {
      score: number;
      feedback: string;
    };
  };
  overallScore: number;
  overallFeedback: string;
  actionableSteps: string[];
}

export interface SOPAnalysisData {
  scores: {
    clarity: {
      score: number;
      feedback: string;
    };
    motivation: {
      score: number;
      feedback: string;
    };
    relevance: {
      score: number;
      feedback: string;
    };
    writing: {
      score: number;
      feedback: string;
    };
  };
  overallScore: number;
  overallFeedback: string;
  actionableSteps: string[];
}

export interface Document_METADATA {
  format: string;
  original_file_name?: string;
  created_from_id?: string;
}

export interface Document_VERSIONS_METADATA {
  format: string;
  content: string;
}

