"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselIndicator,
} from "@/components/ui/carousel";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, Lock, Trophy, Zap, Target, Award } from "lucide-react";
import { useState, useRef, TouchEvent } from "react";
import {
  courseModules,
  type Module,
  type Section,
} from "@/app/config/courseContent";
import {
  initialUserProgress,
  type ModuleProgress,
  type SectionProgress,
} from "@/app/config/userProgress";
import { themeConfig } from "@/app/config/themeConfig";
import { cn } from "@/lib/utils";

export default function LearningMap() {
  const [userProgress, setUserProgress] =
    useState<ModuleProgress[]>(initialUserProgress);

  // 获取模块进度
  const getModuleProgress = (moduleId: string): ModuleProgress | undefined => {
    return userProgress.find((progress) => progress.moduleId === moduleId);
  };

  // 获取章节进度
  const getSectionProgress = (
    moduleId: string,
    sectionId: string
  ): SectionProgress | undefined => {
    const moduleProgress = getModuleProgress(moduleId);
    return moduleProgress?.sections.find(
      (section) => section.sectionId === sectionId
    );
  };

  // 检查模块是否所有任务都完成
  const isModuleCompleted = (moduleId: string): boolean => {
    const moduleProgress = getModuleProgress(moduleId);
    return (
      moduleProgress?.sections.every((section) => section.completed) ?? false
    );
  };

  // 获取收益显示文本
  const getReturnText = (moduleId: string): string => {
    const moduleProgress = getModuleProgress(moduleId);
    if (!moduleProgress?.unlocked) return "Potential XP";
    if (!isModuleCompleted(moduleId)) return "Will Earn";
    return "Daily XP Bonus";
  };

  // 格式化 XP 显示
  const formatXP = (amount: number, perDay: boolean): string => {
    return `${themeConfig.xpReward(amount)}${perDay ? "/day" : ""}`;
  };

  return (
    <div className="relative h-[calc(100vh-220px)] min-h-[500px] rounded-lg overflow-hidden">
      <Carousel className="h-full">
        <CarouselContent className="-ml-4">
          {courseModules.map((module) => {
            const moduleProgress = getModuleProgress(module.id);

            return (
              <CarouselItem key={module.id} className="h-full pl-4">
                <div className="h-full w-full rounded-2xl flex flex-col relative overflow-hidden">
                  {/* Adventure Zone Card */}
                  <div
                    className={`relative rounded-2xl p-6 mb-6 border border-white/50 ${
                      themeConfig.sections[Number(module.id) - 1]?.color ||
                      "bg-gray-100"
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                    <div className="relative flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-white/90 flex items-center justify-center">
                            <Target className="w-7 h-7 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold">
                              {themeConfig.sections[Number(module.id) - 1]
                                ?.name || "Adventure Zone"}
                            </h3>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/80 rounded-lg p-3">
                          <p className="text-sm text-gray-600">
                            {getReturnText(module.id)}
                          </p>
                          <p
                            className={cn(
                              "text-lg font-bold",
                              !isModuleCompleted(module.id)
                                ? "text-gray-500"
                                : "text-green-500"
                            )}
                          >
                            {formatXP(
                              module.xpReward.amount,
                              module.xpReward.perDay
                            )}
                          </p>
                        </div>
                        <div className="bg-white/80 rounded-lg p-3">
                          <p className="text-sm text-gray-600">Progress</p>
                          <p className="text-lg font-bold text-primary">
                            {moduleProgress?.sections.filter(s => s.completed).length}/{module.sections.length} Completed
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quests List */}
                  <div
                    className="relative flex-grow overflow-y-auto touch-pan-y rounded-t-2xl scrollbar-hide"
                  >
                    <div className="space-y-4 py-2">
                      {module.sections.map((section, index) => {
                        const sectionProgress = getSectionProgress(
                          module.id,
                          section.id
                        );

                        return (
                          <motion.div
                            key={section.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={
                              sectionProgress?.unlocked ? { scale: 1.02 } : {}
                            }
                            className={`relative rounded-xl p-6 flex flex-col gap-4 min-h-[200px] w-full ${
                              sectionProgress?.unlocked
                                ? "bg-gray-100 cursor-pointer border-2 border-transparent"
                                : "bg-gray-100 cursor-not-allowed"
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <div
                                className={`min-w-[3rem] h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold
                                  ${
                                    sectionProgress?.completed
                                      ? "bg-gradient-to-br from-green-400 to-green-500"
                                      : sectionProgress?.unlocked
                                        ? "bg-gradient-to-br from-primary to-primary/80"
                                        : "bg-gradient-to-br from-gray-400 to-gray-500"
                                  }`}
                              >
                                {sectionProgress?.completed ? (
                                  <Award className="w-6 h-6" />
                                ) : (
                                  index + 1
                                )}
                              </div>

                              <div className="flex-grow min-w-0">
                                <h4 className="font-bold text-lg mb-2">
                                  {themeConfig.quizTypes[section.type] ||
                                    section.type}
                                </h4>
                                <p className="text-base text-gray-600 mb-3">
                                  {section.description}
                                </p>
                              </div>
                            </div>

                            <div className="flex-grow" />

                            <div className="flex flex-col gap-3">
                              {sectionProgress?.unlocked &&
                                !sectionProgress?.completed && (
                                  <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-3">
                                    <div className="flex items-center gap-2">
                                      <span>Quest Duration:</span>
                                      <span className="font-medium">
                                        {section.estimatedTime}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Star className="w-4 h-4 text-yellow-500" />
                                      <span>
                                        Required: {section.heatsRequired} power
                                        gems
                                      </span>
                                    </div>
                                  </div>
                                )}

                              <div className="flex justify-end">
                                {sectionProgress?.completed ? (
                                  <div className="px-6 py-3 bg-gradient-to-r from-green-400 to-green-500 rounded-xl flex items-center gap-3 text-white font-medium whitespace-nowrap">
                                    <Trophy className="w-5 h-5" />
                                    <span className="text-base">
                                      Achievement Unlocked!
                                    </span>
                                  </div>
                                ) : sectionProgress?.unlocked ? (
                                  <Link
                                    href={`/quiz/${module.id}/${section.id}`}
                                    className="w-full"
                                  >
                                    <div className="px-6 py-3 bg-gradient-to-r from-primary to-primary/80 text-white text-base rounded-xl font-medium hover:from-primary/90 hover:to-primary transition-all duration-300 whitespace-nowrap text-center">
                                      <span className="flex items-center justify-center gap-2">
                                        <Zap className="w-5 h-5" />
                                        Begin Challenge
                                      </span>
                                    </div>
                                  </Link>
                                ) : (
                                  <div className="px-6 py-3 bg-gradient-to-r from-gray-300 to-gray-400 text-white text-base rounded-xl font-medium flex items-center gap-3 whitespace-nowrap w-full justify-center">
                                    <Lock className="w-5 h-5" />
                                    <span>Quest Locked</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselIndicator className="fixed bottom-4 left-0 right-0" />
      </Carousel>
    </div>
  );
}
