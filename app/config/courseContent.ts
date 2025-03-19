// 课程内容, 以心理学为例

import { Quiz, QUIZ_TYPES } from "./const";

export interface Module {
  id: string;
  xpReward: {
    amount: number;
    perDay: boolean;
  };
  sections: Section[];
}

export interface Section {
  id: string;
  type: Quiz;
  description: string;
  heatsRequired: number;
  estimatedTime: string;
}

export interface CourseDetail {
  id: string;
  type: Quiz;
  content?: any;
}

export const courseModules: Module[] = [
  {
    id: "1",
    xpReward: {
      amount: 1000,
      perDay: true,
    },
    sections: [
      {
        id: "1-1",
        type: QUIZ_TYPES.MATCHING,
        description: "短时记忆 vs. 长期记忆的区别",
        heatsRequired: 1,
        estimatedTime: "5分钟",
      },
      {
        id: "1-2",
        type: QUIZ_TYPES.MULTIPLE_CHOICE,
        description: "短时记忆 vs. 长期记忆的特点",
        heatsRequired: 1,
        estimatedTime: "5分钟",
      },
      {
        id: "1-3",
        type: QUIZ_TYPES.FILL_IN_THE_BLANK,
        description: "短时记忆如何变成长时记忆",
        heatsRequired: 1,
        estimatedTime: "5分钟",
      },
      {
        id: "1-4",
        type: QUIZ_TYPES.DIALOGUE,
        description: "如何增强记忆",
        heatsRequired: 1,
        estimatedTime: "5分钟",
      },
    ],
  },
  {
    id: "2",
    xpReward: {
      amount: 2000,
      perDay: true,
    },
    sections: [
      {
        id: "2-1",
        type: QUIZ_TYPES.MULTIPLE_CHOICE,
        description: "测试你对大脑不同区域功能的理解",
        heatsRequired: 1,
        estimatedTime: "5分钟",
      },
      {
        id: "2-2",
        type: QUIZ_TYPES.MATCHING,
        description: "探索不同类型的记忆及其特征",
        heatsRequired: 1,
        estimatedTime: "5分钟",
      },
      {
        id: "2-3",
        type: QUIZ_TYPES.DIALOGUE,
        description: "学习经典条件反射和强化理论",
        heatsRequired: 1,
        estimatedTime: "5分钟",
      },
      {
        id: "2-4",
        type: QUIZ_TYPES.FILL_IN_THE_BLANK,
        description: "探索情绪的生理基础",
        heatsRequired: 1,
        estimatedTime: "5分钟",
      },
    ],
  },
];

export const courseDetails: CourseDetail[] = [
  {
    id: "1-1",
    type: QUIZ_TYPES.MATCHING,
    content: {
      title: "短时记忆 vs. 长期记忆的区别",
      instruction:
        "请从每一行中选择正确的选项，形成完整的记忆类型、特点和示例。",
      rows: [
        {
          id: "type",
          text: "记忆类型",
          options: [
            { id: "A1", text: "短时记忆（Short-term Memory）" },
            { id: "A2", text: "长期记忆（Long-term Memory）" },
          ],
        },
        {
          id: "characteristic",
          text: "特点",
          options: [
            { id: "B1", text: "可存储大量信息，时间长达数年甚至一生" },
            { id: "B2", text: "只能存储 7±2 个信息单元，持续约 20 秒" },
          ],
        },
        {
          id: "example",
          text: "示例",
          options: [
            { id: "C1", text: "你还能回忆起小学时最好的朋友的名字" },
            { id: "C3", text: "你听到一个新电话号码，在拨号前暂时记住它" },
          ],
        },
      ],
      concepts: [
        {
          name: "短时记忆",
          matches: { type: "A1", characteristic: "B2", example: "C3" },
        },
        {
          name: "长期记忆",
          matches: { type: "A2", characteristic: "B1", example: "C1" },
        },
      ],
    },
  },
  {
    id: "1-2",
    type: QUIZ_TYPES.MULTIPLE_CHOICE,
    content: {
      title: "短时记忆 vs. 长期记忆的特点",
      instruction: "选择正确的答案，每道题涉及短时记忆和长期记忆。",
      questions: [
        {
          id: "Q1",
          text: "短时记忆的存储时间通常是",
          options: [
            { id: "A", text: "1-2 秒" },
            { id: "B", text: "5-10 秒" },
            { id: "C", text: "15-30 秒" },
            { id: "D", text: "1 天" },
          ],
          correctAnswer: "C",
          explanation: "短时记忆一般持续 15-30 秒",
        },
        {
          id: "Q2",
          text: "以下哪种情况涉及长期记忆？",
          options: [
            { id: "A", text: "你记住了一张演讲幻灯片上的几个关键词" },
            { id: "B", text: "你记得 5 年前去过的旅行地点" },
            { id: "C", text: "你正在拨打一个刚刚看到的电话号码" },
            { id: "D", text: "你看到了一道数学题并在 10 秒内解答它" },
          ],
          correctAnswer: "B",
          explanation: "长期记忆可以存储数年甚至终身",
        },
        {
          id: "Q3",
          text: "短时记忆的信息如果没有经过复述或深度加工，会在大约多久后消失？",
          options: [
            { id: "A", text: "10 秒" },
            { id: "B", text: "20-30 秒" },
            { id: "C", text: "1 小时" },
            { id: "D", text: "1 天" },
          ],
          correctAnswer: "B",
          explanation: "短时记忆的信息如果不复述，大约 20-30 秒后会消失",
        },
        {
          id: "Q4",
          text: "哪种方法最有助于将短时记忆转化为长期记忆？",
          options: [
            { id: "A", text: "不断复述信息" },
            { id: "B", text: "短时间内快速学习大量信息" },
            { id: "C", text: "在噪音环境下学习" },
            { id: "D", text: "只在考试前临时抱佛脚" },
          ],
          correctAnswer: "A",
          explanation: "重复复述或与已有知识建立联系能有效转化为长期记忆",
        },
      ],
    },
  },
  {
    id: "1-3",
    type: QUIZ_TYPES.FILL_IN_THE_BLANK,
    content: {
      title: "短时记忆如何变成长时记忆",
      instruction: "请填空，使以下心理学概念完整。",
      questions: [
        {
          id: "F1",
          text: '短时记忆的容量通常是_______（填入一个数字）个信息单元，因此我们常用"分组"（chunking）技巧来增强记忆能力。',
          answer: "7",
          hint: "这是一个范围，中心值是7",
        },
        {
          id: "F2",
          text: "短时记忆如果没有被复述，大约_______（填入时间）秒后会消失。",
          answer: "20",
          hint: "是几十秒的范围",
        },
        {
          id: "F3",
          text: "将短时记忆转化为长期记忆的常见方法是_______（填入记忆策略），这种方法是指在不同时间间隔内反复复习信息。",
          answer: "间隔重复",
          hint: "这种方法的特点是在不同的时间间隔内复习",
        },
        {
          id: "F4",
          text: "长期记忆可以分为显性记忆和隐性记忆，其中显性记忆包括情节记忆和_______（填入记忆类型），即对事实和概念的记忆。",
          answer: "语义记忆",
          hint: "这种记忆与语言和概念有关",
        },
      ],
    },
  },
  {
    id: "1-4",
    type: QUIZ_TYPES.DIALOGUE,
    content: {
      title: "如何增强记忆",
      instruction: "填补对话中的空缺，使其符合记忆理论。",
      dialogue: [
        {
          speaker: "小李",
          text: "我总是背完单词就忘，怎么才能记得更久呢？",
        },
        {
          speaker: "小王",
          text: "你现在是把这些单词存储在_______里，如果不复习，大约 20 秒后就会忘记。",
          blank: {
            id: "D1",
            answer: "短时记忆",
            hint: "这种记忆只能持续很短时间",
          },
        },
        {
          speaker: "小李",
          text: "那我应该怎么做？",
        },
        {
          speaker: "小王",
          text: "你可以用间隔重复法，也就是在不同的时间间隔内复习单词，这样可以把它们转化为_______。",
          blank: {
            id: "D2",
            answer: "长期记忆",
            hint: "这种记忆可以保存很长时间",
          },
        },
        {
          speaker: "小李",
          text: "长期记忆是不是存储时间特别长？",
        },
        {
          speaker: "小王",
          text: "对，它可以存储数年甚至一生，像你小学学过的乘法口诀表，就是存储在你的_______中。",
          blank: {
            id: "D3",
            answer: "长期记忆",
            hint: "这种记忆可以保存很长时间",
          },
        },
        {
          speaker: "小李",
          text: "那短时记忆的容量有多大？",
        },
        {
          speaker: "小王",
          text: "一般来说，它能存储_______个信息单元左右。",
          blank: {
            id: "D4",
            answer: "7",
            hint: "这是一个范围，中心值是7",
          },
        },
      ],
    },
  },
];
