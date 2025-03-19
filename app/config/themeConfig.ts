// 游戏配置, 以汉堡店为例
import { QUIZ_TYPES } from "./const";

export const themeConfig = {
  sections: [
    {
      name: "北京",
      color: "bg-amber-100",
    },
    {
      name: "上海",
      color: "bg-blue-100",
    },
    {
      name: "广州",
      color: "bg-green-100",
    },
    {
      name: "深圳",
      color: "bg-red-100",
    },
  ],
  xpReward: (num: number) => `¥${num}`,
  quizTypes: {
    [QUIZ_TYPES.MATCHING]: "食材配配配",
    [QUIZ_TYPES.MULTIPLE_CHOICE]: "菜单选选选",
    [QUIZ_TYPES.FILL_IN_THE_BLANK]: "点单点点点",
    [QUIZ_TYPES.DIALOGUE]: "上菜送送送",
  },
};
