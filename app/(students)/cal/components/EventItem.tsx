"use client";

import { BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { themeConfig } from "@/app/config/themeConfig";
import LORMilestone from "./LORMilestone";
import DeadlineEvent from "./DeadlineEvent";
import DocumentAttachmentEvent from "./DocumentAttachmentEvent";

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  action_type: string;
  program_id: string;
  content?: any;
}

interface EventItemProps {
  event: CalendarEvent;
}

// 解析事件描述中的JSON内容
const parseEventContent = (event: CalendarEvent) => {
  let eventWithContent = { ...event };

  try {
    if (!event.content && event.description && typeof event.description === 'string') {
      // 尝试直接解析JSON
      try {
        eventWithContent.content = JSON.parse(event.description);
      } catch (e) {
        // 如果直接解析失败，可能是描述中包含JSON字符串
        if (event.description.includes('{') && event.description.includes('}')) {
          const match = event.description.match(/\{.*\}/);
          if (match) {
            try {
              eventWithContent.content = JSON.parse(match[0]);
            } catch (e2) {
              console.error("Failed to parse JSON from description substring", e2);
            }
          }
        }
      }
    }
  } catch (e) {
    console.error("Failed to parse event content", e);
  }

  return eventWithContent;
};

export default function EventItem({ event }: EventItemProps) {
  // 根据事件类型决定使用哪个组件
  const eventWithContent = parseEventContent(event);

  // 推荐信发送事件
  if (event.action_type === 'recommendation_letter_sent') {
    return <LORMilestone event={eventWithContent} />;
  }

  // 截止日期事件
  if (event.action_type === 'deadline') {
    return <DeadlineEvent event={eventWithContent} />;
  }

  // Document attachment events (CV or SOP)
  if (event.action_type === 'cv_attached' || event.action_type === 'sop_attached') {
    return <DocumentAttachmentEvent event={eventWithContent} />;
  }

  // 默认事件渲染（通用事件）
  const theme = themeConfig.actionThemes[event.action_type as keyof typeof themeConfig.actionThemes] || {
    color: "bg-gray-100 text-gray-600",
    icon: BookOpen
  };

  const colorClass = theme.color;
  const IconComponent = theme.icon;

  // Extract the color for border
  const borderColor = colorClass.split(' ')[0].replace('bg-', 'border-');

  return (
    <motion.div
      initial={{ x: -10, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`flex gap-3 p-3 rounded-lg hover:bg-sand/80 transition-colors border-l-4 ${borderColor} bg-sand`}
    >
      <div className={`w-8 h-8 rounded-full ${colorClass} flex items-center justify-center flex-shrink-0`}>
        <IconComponent size={16} />
      </div>

      <div className="flex-1">
        <div>
          <h3 className="font-semibold text-black">{event.title}</h3>

          {event.program_id && (
            <span className="text-xs text-bronze/70 block">
              Program ID: {event.program_id}
            </span>
          )}

          {event.description && (
            <p className="mt-2 text-sm text-bronze/80">{event.description}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}