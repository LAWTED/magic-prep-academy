// 模块进度
export interface ModuleProgress {
  moduleId: string;
  unlocked: boolean;
  sections: SectionProgress[];
}

export interface SectionProgress {
  sectionId: string;
  completed: boolean;
  unlocked: boolean;
}

export const initialUserProgress: ModuleProgress[] = [
  {
    moduleId: "1",
    unlocked: true,
    sections: [
      {
        sectionId: "1-1",
        completed: false,
        unlocked: true,
      },
      {
        sectionId: "1-2",
        completed: false,
        unlocked: true,
      },
      {
        sectionId: "1-3",
        completed: false,
        unlocked: true,
      },
      {
        sectionId: "1-4",
        completed: false,
        unlocked: true,
      },
    ],
  },
  {
    moduleId: "2",
    unlocked: true,
    sections: [
      {
        sectionId: "2-1",
        completed: true,
        unlocked: true,
      },
      {
        sectionId: "2-2",
        completed: true,
        unlocked: true,
      },
      {
        sectionId: "2-3",
        completed: true,
        unlocked: true,
      },
      {
        sectionId: "2-4",
        completed: true,
        unlocked: true,
      },
    ],
  },
];
