"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useUserStore } from "@/store/userStore";
import { themeConfig } from "@/app/config/themeConfig";
import { useSearchParams, useRouter } from "next/navigation";

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  action_type: string;
  program_id: string;
}

// 创建客户端实例移到组件外部
const supabase = createClient();

// 根据项目ID获取项目名称的组件
function ProgramName({ programId }: { programId: string }) {
  const [programName, setProgramName] = useState<string>("");
  const [schoolName, setSchoolName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchProgramInfo() {
      try {
        // 获取项目信息
        const { data: programData, error: programError } = await supabase
          .from('programs')
          .select('name, content, school_id')
          .eq('id', programId)
          .single();

        if (programError || !programData) {
          console.error("Error fetching program:", programError);
          return;
        }

        // 设置项目名称
        const displayName = programData.name ||
                          (programData.content?.name ? programData.content.name : "Program");
        setProgramName(displayName);

        // 获取学校信息
        if (programData.school_id) {
          const { data: schoolData, error: schoolError } = await supabase
            .from('schools')
            .select('name')
            .eq('id', programData.school_id)
            .single();

          if (!schoolError && schoolData) {
            setSchoolName(schoolData.name);
          }
        }
      } catch (error) {
        console.error("Error in fetchProgramInfo:", error);
      } finally {
        setLoading(false);
      }
    }

    if (programId) {
      fetchProgramInfo();
    }
  }, [programId]);

  if (loading) {
    return <span className="text-xs text-gray-400">Loading program info...</span>;
  }

  return (
    <span className="text-xs text-gray-500 block">
      {schoolName && `${schoolName} - `}{programName}
    </span>
  );
}

export default function CalendarPage() {
  const today = new Date();
  const searchParams = useSearchParams();
  const router = useRouter();
  const dateParam = searchParams.get("date");

  // 一次性初始化日期，不要在useEffect中设置初始状态
  const getInitialDate = () => {
    if (dateParam) {
      const parsedDate = new Date(dateParam);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
    return today;
  };

  const initialDate = getInitialDate();
  const initialMonthDate = new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);

  const [currentDate, setCurrentDate] = useState(initialMonthDate);
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUserStore();

  // Fetch calendar events from user_program_event
  useEffect(() => {
    if (!user) return;

    // 获取当前月份的开始和结束日期
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Format dates for query
    const startDate = startOfMonth.toISOString().split('T')[0];
    const endDate = endOfMonth.toISOString().split('T')[0];

    console.log(`Fetching events for ${startDate} to ${endDate}`);
    setLoading(true);

    // 使用异步立即执行函数模式
    (async () => {
      try {
        // Fetch events where event duration overlaps with current month
        const { data, error } = await supabase
          .from('user_program_event')
          .select(`
            id, title, description, start_date, end_date, action_type, program_id
          `)
          .eq('user_id', user?.id || '')
          .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);

        if (error) {
          console.error("Error fetching events:", error);
          return;
        }

        // Process and format events
        if (data) {
          setEvents(data);
        }
      } catch (error) {
        console.error("Failed to fetch events:", error);
      } finally {
        setLoading(false);
      }
    })();

  // 月份变化时需要重新获取事件
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, `${currentDate.getFullYear()}-${currentDate.getMonth()}`]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];

    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event =>
      dateStr >= event.start_date && dateStr <= event.end_date
    );
  };

  // Check if date has events
  const hasEvents = (date: Date | null) => {
    if (!date) return false;
    return getEventsForDate(date).length > 0;
  };

  // Get only school-specific events (submit_application type)
  const getSchoolEventsForDate = (date: Date | null) => {
    if (!date) return [];

    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event =>
      dateStr >= event.start_date &&
      dateStr <= event.end_date &&
      event.action_type === 'submit_application'
    );
  };

  // Check if date has school-specific events
  const hasSchoolEvents = (date: Date | null) => {
    if (!date) return false;
    return getSchoolEventsForDate(date).length > 0;
  };

  // Check if a date falls within a common timeline event
  const getCommonTimelineEventsForDate = (date: Date | null) => {
    if (!date) return [];

    const dateStr = date.toISOString().split('T')[0];
    const commonEvents = Object.entries(themeConfig.commonTimelineEvents).filter(([action_type, event]) =>
      dateStr >= event.start_date && dateStr <= event.end_date
    );

    return commonEvents.map(([action_type, event]) => ({
      id: action_type,
      action_type,
      title: event.title,
      description: event.description,
      start_date: event.start_date,
      end_date: event.end_date,
      program_id: '', // Common events don't have a program ID
    }));
  };

  // Get all events for a date (now only returns database events)
  const getAllEventsForDate = (date: Date | null) => {
    if (!date) return [];
    return getEventsForDate(date);
  };

  // Check if date falls within any common timeline event
  const getCommonTimelineColorForDate = (date: Date | null) => {
    if (!date) return null;

    const commonEvents = getCommonTimelineEventsForDate(date);
    if (commonEvents.length === 0) return null;

    // Get the first matching common event
    const firstEvent = commonEvents[0];
    const theme = themeConfig.actionThemes[firstEvent.action_type as keyof typeof themeConfig.actionThemes];

    // Return just the background color class
    return theme?.color.split(' ')[0] || null;
  };

  // Get theme for action type with fallback
  const getThemeForAction = (action_type: string) => {
    // 截止日期事件使用红色主题
    if (action_type === 'submit_application') {
      return {
        ...themeConfig.actionThemes.submit_application,
        color: 'bg-red-100 text-red-500' // 修改为红色主题
      };
    }

    return themeConfig.actionThemes[action_type as keyof typeof themeConfig.actionThemes] ||
      themeConfig.actionThemes.submit_application; // Fallback to default
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const isSelectedDate = (day: Date | null) => {
    if (!day || !selectedDate) return false;
    return day.toDateString() === selectedDate.toDateString();
  };

  // Get database events for the selected date
  const selectedDateEvents = getAllEventsForDate(selectedDate);

  // 获取当前选中日期的通用时间线事件
  const selectedDateCommonEvents = getCommonTimelineEventsForDate(selectedDate);

  // 更新选中日期并更新URL
  const updateSelectedDate = (date: Date) => {
    setSelectedDate(date);

    // 使用原生Date方法获取年月日，避免时区问题
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从0开始
    const day = String(date.getDate()).padStart(2, '0');

    // 将日期格式化为YYYY-MM-DD格式
    const formattedDate = `${year}-${month}-${day}`;

    // 更新URL参数
    router.push(`/cal?date=${formattedDate}`);
  };

  // 组件加载时如果没有日期参数，设置为今天的日期
  useEffect(() => {
    if (!dateParam) {
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const formattedToday = `${year}-${month}-${day}`;
      router.push(`/cal?date=${formattedToday}`);
    }
  }, [dateParam, router, today]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateMonth("prev")}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ChevronLeft size={24} />
          </button>
          <span className="text-lg font-medium">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button
            onClick={() => navigateMonth("next")}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      {/* Common Timeline Section - 只显示当前选中日期的通用事件 */}
      {selectedDateCommonEvents.length > 0 && (
        <div className="mb-6 space-y-2">
          {selectedDateCommonEvents.map(event => {
            const theme = getThemeForAction(event.action_type);
            const IconComponent = theme.icon;
            const colorClass = theme.color;

            return (
              <div
                key={event.id}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded-md text-sm border-l-4 shadow-sm w-full"
                style={{ borderLeftColor: theme.color.split(' ')[0].replace('bg-', '') === 'blue-100' ? '#DBEAFE' :
                        theme.color.split(' ')[0].replace('bg-', '') === 'purple-100' ? '#F3E8FF' :
                        theme.color.split(' ')[0].replace('bg-', '') === 'green-100' ? '#DCFCE7' :
                        theme.color.split(' ')[0].replace('bg-', '') === 'yellow-100' ? '#FEF9C3' :
                        theme.color.split(' ')[0].replace('bg-', '') === 'red-100' ? '#FEE2E2' :
                        theme.color.split(' ')[0].replace('bg-', '') === 'indigo-100' ? '#E0E7FF' : '#E5E7EB' }}
              >
                <div className={`w-5 h-5 rounded-full ${colorClass} flex items-center justify-center flex-shrink-0`}>
                  <IconComponent size={10} />
                </div>
                <span className="font-medium">{event.title}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const isSelected = isSelectedDate(day);
          const dateHasSchoolEvents = hasSchoolEvents(day);
          const commonTimelineColor = getCommonTimelineColorForDate(day);
          const schoolEvents = day ? getSchoolEventsForDate(day) : [];

          // 为有截止日期的日子设置边框样式
          let borderStyle = {};
          if (dateHasSchoolEvents && day) {
            borderStyle = {
              borderWidth: '2px',
              borderStyle: 'solid',
              borderColor: '#EF4444' // 红色的截止日期边框，更鲜艳
            };
          }

          return (
            <motion.div
              key={index}
              whileTap={{ scale: 0.95 }}
              onClick={() => day && updateSelectedDate(day)}
              style={borderStyle}
              className={`
                aspect-square flex flex-col items-center justify-start p-1 rounded-lg relative
                ${day ? "cursor-pointer" : ""}
                ${!isSelected && day ? "hover:bg-gray-100" : ""}
                ${isSelected ? "bg-primary text-white" : commonTimelineColor ? `${commonTimelineColor} bg-opacity-20` : ""}
              `}
            >
              <span className="text-sm mb-1">{day?.getDate()}</span>
            </motion.div>
          );
        })}
      </div>

      {selectedDate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-white rounded-lg shadow-sm"
        >
          <h2 className="text-lg font-medium mb-4">
            {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </h2>

          {loading ? (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : selectedDateEvents.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No deadlines scheduled for this day</p>
          ) : (
            <div className="space-y-3">
              {selectedDateEvents.map((event) => {
                const theme = getThemeForAction(event.action_type);
                const IconComponent = theme.icon;
                const colorClass = theme.color;

                return (
                  <motion.div
                    key={event.id}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="flex gap-3 p-3 rounded-lg hover:bg-gray-50"
                  >
                    <div className={`w-8 h-8 rounded-full ${colorClass} flex items-center justify-center flex-shrink-0`}>
                      <IconComponent size={16} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{event.title}</h3>
                          {event.program_id && (
                            <ProgramName programId={event.program_id} />
                          )}
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {new Date(event.start_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}