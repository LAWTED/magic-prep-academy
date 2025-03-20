// 游戏配置, 以汉堡店为例
import { CircleDollarSign, Heart } from "lucide-react";
import { QUIZ_TYPES } from "./const";

export const themeConfig = {
  xpReward: (num: number) => (
    <span className="flex items-center gap-1">
      <CircleDollarSign className="w-4 h-4 text-green-500 font-bold" />
      {num}
    </span>
  ),
  hearts: (num: number) => (
    <span className="flex items-center gap-1">
      <Heart className="w-4 h-4 text-red-500 font-bold" />
      {num}
    </span>
  ),
};
