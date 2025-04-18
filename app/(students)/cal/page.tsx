"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Globe,
  BookOpen,
  Check,
  CalendarIcon,
  ChevronDown,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useUserStore } from "@/store/userStore";
import { themeConfig } from "@/app/config/themeConfig";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { TextMorph } from "@/components/ui/text-morph";
import EventItem from "./components/EventItem";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LoadingCard from "@/app/components/LoadingCard";
import { cn } from "@/lib/utils";
import { getTimeframe } from "@/utils/utils";

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  action_type: string;
  program_id: string;
}

// 推荐信事件内容接口
interface RecommendationLetterEventContent {
  mentor_name?: string;
  school_name?: string;
  program_name?: string;
  document_id?: string;
  [key: string]: any; // 允许其他属性
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
          .from("programs")
          .select("name, content, school_id")
          .eq("id", programId)
          .single();

        if (programError || !programData) {
          console.error("Error fetching program:", programError);
          return;
        }

        // 设置项目名称
        const displayName =
          programData.name ||
          (programData.content?.name ? programData.content.name : "Program");
        setProgramName(displayName);

        // 获取学校信息
        if (programData.school_id) {
          const { data: schoolData, error: schoolError } = await supabase
            .from("schools")
            .select("name")
            .eq("id", programData.school_id)
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
    return (
      <span className="text-xs text-bronze/50">Loading program info...</span>
    );
  }

  return (
    <span className="text-xs text-gray-500 block">
      {schoolName && `${schoolName} - `}
      {programName}
    </span>
  );
}

function Calendar() {
  const today = new Date();
  const searchParams = useSearchParams();
  const router = useRouter();
  const dateParam = searchParams?.get("date");

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
  const initialMonthDate = new Date(
    initialDate.getFullYear(),
    initialDate.getMonth(),
    1
  );

  const [currentDate, setCurrentDate] = useState(initialMonthDate);
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(
    null
  );
  const { user } = useUserStore();

  // Available years for selection (covering current year + 2025-2026 application timeline)
  const currentYear = today.getFullYear();
  const startYear = Math.min(currentYear, 2025); // Start from earlier of current year or 2025
  const endYear = 2027; // Add an extra year after the end of timeline
  const years = Array.from(
    { length: endYear - startYear + 1 },
    (_, i) => startYear + i
  );

  // Month names for selection
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const [headerText, setHeaderText] = useState(() => {
    // Initialize with "Calendar" if selected date is today, otherwise "Carpe diem"
    const today = new Date();
    const selectedDay = getInitialDate();
    return today.toDateString() === selectedDay.toDateString()
      ? "Calendar"
      : "Carpe diem";
  });

  // Handle month selection change
  const handleMonthChange = (value: string) => {
    const newMonth = parseInt(value);
    const oldMonth = currentDate.getMonth();
    setSlideDirection(newMonth > oldMonth ? "left" : "right");
    setCurrentDate(new Date(currentDate.getFullYear(), newMonth, 1));
  };

  // Handle year selection change
  const handleYearChange = (value: string) => {
    const newYear = parseInt(value);
    const oldYear = currentDate.getFullYear();
    setSlideDirection(newYear > oldYear ? "left" : "right");
    setCurrentDate(new Date(newYear, currentDate.getMonth(), 1));
  };

  // Navigate to today's date and toggle header text
  const goToToday = () => {
    const today = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();

    // Determine slide direction based on date comparison
    if (
      todayYear > currentYear ||
      (todayYear === currentYear && todayMonth > currentMonth)
    ) {
      setSlideDirection("left");
    } else if (
      todayYear < currentYear ||
      (todayYear === currentYear && todayMonth < currentMonth)
    ) {
      setSlideDirection("right");
    } else {
      setSlideDirection(null);
    }

    // Set header text to "Calendar" when today is selected
    setHeaderText("Calendar");

    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    updateSelectedDate(today);
  };

  // Fetch calendar events from user_program_event
  useEffect(() => {
    if (!user) return;

    // 获取当前月份的开始和结束日期
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const endOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    // Format dates for query
    const startDate = startOfMonth.toISOString().split("T")[0];
    const endDate = endOfMonth.toISOString().split("T")[0];

    console.log(`Fetching events for ${startDate} to ${endDate}`);
    setLoading(true);

    // 使用异步立即执行函数模式
    (async () => {
      try {
        // Fetch events where event duration overlaps with current month
        const { data, error } = await supabase
          .from("user_program_event")
          .select(
            `
            id, title, description, start_date, end_date, action_type, program_id
          `
          )
          .eq("user_id", user?.id || "")
          .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);

        if (error) {
          console.error("Error fetching events:", error);
          return;
        }

        // Process and format events
        if (data) {
          console.log("Calendar events loaded:", data.length);
          // 查找并记录推荐信发送事件
          const recommendationEvents = data.filter(
            (event) => event.action_type === "recommendation_letter_sent"
          );
          if (recommendationEvents.length > 0) {
            console.log(
              "Found recommendation letter events:",
              recommendationEvents.length
            );
            recommendationEvents.forEach((event) => {
              console.log(
                "Recommendation letter event:",
                event.title,
                event.start_date
              );
              // 尝试解析事件描述
              try {
                if (
                  event.description &&
                  typeof event.description === "string"
                ) {
                  let content;
                  // 尝试不同的解析方法
                  if (
                    event.description.startsWith("{") &&
                    event.description.endsWith("}")
                  ) {
                    content = JSON.parse(event.description);
                    console.log("Parsed event content:", content);
                  }
                }
              } catch (e) {
                console.error(
                  "Failed to parse event description:",
                  event.description
                );
              }
            });
          }
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
    setSlideDirection(direction === "prev" ? "right" : "left");
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

    // 使用日期的年月日部分进行比较，避免时区问题
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dateStr = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;

    return events.filter((event) => {
      // 将事件日期截取到年月日部分
      const startDateParts = event.start_date.split("T")[0];
      const endDateParts = event.end_date.split("T")[0];

      return dateStr >= startDateParts && dateStr <= endDateParts;
    });
  };

  // Check if date has events
  const hasEvents = (date: Date | null) => {
    if (!date) return false;
    return getEventsForDate(date).length > 0;
  };

  // Get only school-specific events (deadline type)
  const getSchoolEventsForDate = (date: Date | null) => {
    if (!date) return [];

    // 使用日期的年月日部分进行比较，避免时区问题
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dateStr = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;

    return events.filter((event) => {
      // 将事件日期截取到年月日部分
      const startDateParts = event.start_date.split("T")[0];
      const endDateParts = event.end_date.split("T")[0];

      return (
        dateStr >= startDateParts &&
        dateStr <= endDateParts &&
        event.action_type === "deadline"
      );
    });
  };

  // Get recommendation letter sent events for a date
  const getRecommendationLetterEvents = (date: Date | null) => {
    if (!date) return [];

    // 使用日期的年月日部分进行比较，避免时区问题
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dateStr = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;

    return events.filter((event) => {
      // 将事件日期截取到年月日部分
      const startDateParts = event.start_date.split("T")[0];
      const endDateParts = event.end_date.split("T")[0];

      return (
        dateStr >= startDateParts &&
        dateStr <= endDateParts &&
        event.action_type === "recommendation_letter_sent"
      );
    });
  };

  // Check if date has recommendation letter events
  const hasRecommendationLetterEvents = (date: Date | null) => {
    if (!date) return false;
    return getRecommendationLetterEvents(date).length > 0;
  };

  // Get document attachment events (CV/SOP) for a date
  const getDocumentAttachmentEvents = (date: Date | null) => {
    if (!date) return [];

    // Use the date's year, month, and day parts for comparison to avoid timezone issues
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dateStr = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;

    return events.filter((event) => {
      // Get the date parts of the event dates
      const startDateParts = event.start_date.split("T")[0];
      const endDateParts = event.end_date.split("T")[0];

      return (
        dateStr >= startDateParts &&
        dateStr <= endDateParts &&
        (event.action_type === "cv_attached" || event.action_type === "sop_attached")
      );
    });
  };

  // Check if date has document attachment events
  const hasDocumentAttachmentEvents = (date: Date | null) => {
    if (!date) return false;
    return getDocumentAttachmentEvents(date).length > 0;
  };

  // Check if date has school-specific events
  const hasSchoolEvents = (date: Date | null) => {
    if (!date) return false;
    return getSchoolEventsForDate(date).length > 0;
  };

  // Check if a date falls within a common timeline event
  const getCommonTimelineEventsForDate = (date: Date | null) => {
    if (!date) return [];

    // 使用日期的年月日部分进行比较，避免时区问题
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dateStr = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;

    const commonEvents = Object.entries(
      themeConfig.commonTimelineEvents
    ).filter(([action_type, event]) => {
      // 确保日期范围比较是基于年月日部分
      return dateStr >= event.start_date && dateStr <= event.end_date;
    });

    return commonEvents.map(([action_type, event]) => ({
      id: action_type,
      action_type,
      title: event.title,
      description: event.description,
      start_date: event.start_date,
      end_date: event.end_date,
      program_id: "", // Common events don't have a program ID
    }));
  };

  // Get all events for a date (now only returns database events)
  const getAllEventsForDate = (date: Date | null) => {
    if (!date) return [];

    // Just return all events from the database - document events are already included
    return getEventsForDate(date);
  };

  // Check if date falls within any common timeline event
  const getCommonTimelineColorForDate = (date: Date | null) => {
    if (!date) return null;

    const commonEvents = getCommonTimelineEventsForDate(date);
    if (commonEvents.length === 0) return null;

    // Get the first matching common event
    const firstEvent = commonEvents[0];
    const theme =
      themeConfig.actionThemes[
        firstEvent.action_type as keyof typeof themeConfig.actionThemes
      ];

    // Return just the background color class
    return theme?.color.split(" ")[0] || null;
  };

  // Get theme for action type with fallback
  const getThemeForAction = (action_type: string) => {
    // 截止日期事件使用红色主题
    if (action_type === "deadline") {
      return {
        color: "bg-bronze/20 text-bronze",
        icon: Globe, // Using Globe icon for deadlines
      };
    }

    // Try to get from action themes
    const actionTheme =
      themeConfig.actionThemes[
        action_type as keyof typeof themeConfig.actionThemes
      ];
    if (actionTheme) {
      return actionTheme;
    }

    // Default fallback
    return {
      color: "bg-sand/40 text-bronze",
      icon: BookOpen,
    };
  };

  // Get the image path for an event based on its action_type
  const getEventImageForDate = (date: Date | null) => {
    if (!date) return null;

    // Check for common timeline events first
    const commonEvents = getCommonTimelineEventsForDate(date);
    if (commonEvents.length > 0) {
      const actionType = commonEvents[0].action_type;
      // Check if the action type exists in commonTimelineEvents
      if (actionType in themeConfig.commonTimelineEvents) {
        return (
          themeConfig.commonTimelineEvents[
            actionType as keyof typeof themeConfig.commonTimelineEvents
          ].pic || "/images/cal/stamp.png"
        );
      }
      return "/images/cal/stamp.png";
    }

    // If no common events, check for document attachment events (CV/SOP)
    const documentEvents = getDocumentAttachmentEvents(date);
    if (documentEvents.length > 0) {
      return "/images/cal/document_added.png"; // Using a document icon for CV/SOP attachments
    }

    // If no document events, check for recommendation letter events
    const recommendationEvents = getRecommendationLetterEvents(date);
    if (recommendationEvents.length > 0) {
      return "/images/cal/application_materials.png"; // Using application materials icon for recommendation letters
    }

    // If no recommendation events, check for school events (deadline events)
    const schoolEvents = getSchoolEventsForDate(date);
    if (schoolEvents.length > 0) {
      // Use a dedicated deadline icon or fallback to application_materials.png
      return "/images/cal/stamp.png"; // Using stamp.png for deadlines
    }

    return null;
  };

  const days = getDaysInMonth(currentDate);
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

    // Update header text based on whether selected date is today
    const today = new Date();
    setHeaderText(
      today.toDateString() === date.toDateString() ? "Calendar" : "Carpe diem"
    );

    // 使用原生Date方法获取年月日，避免时区问题
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // 月份从0开始
    const day = String(date.getDate()).padStart(2, "0");

    // 将日期格式化为YYYY-MM-DD格式
    const formattedDate = `${year}-${month}-${day}`;

    // 更新URL参数
    router.push(`/cal?date=${formattedDate}`);
  };

  // 组件加载时如果没有日期参数，设置为今天的日期
  useEffect(() => {
    if (!dateParam) {
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      const formattedToday = `${year}-${month}-${day}`;
      router.push(`/cal?date=${formattedToday}`);
    }
  }, [dateParam, router, today]);

  // Animation variants for the month grid
  const gridVariants = {
    enter: (direction: "left" | "right" | null) => ({
      x: direction === "left" ? "100%" : direction === "right" ? "-100%" : 0,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: "left" | "right" | null) => ({
      x: direction === "left" ? "-100%" : direction === "right" ? "100%" : 0,
      opacity: 0,
    }),
  };

  // Animation variants for day cells
  const dayCellVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: (index: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: index * 0.01, // Staggered effect
        duration: 0.2,
      },
    }),
  };

  return (
    <div className="p-4 ">
      <h2 className="text-lg font-bold bg-gold py-4 z-10 text-bronze rounded-lg px-4 shadow-sm mb-4 flex items-center justify-between gap-2">
        <div
          className="cursor-pointer hover:text-bronze transition-colors"
          onClick={goToToday}
          title="Click to view today"
        >
          <TextMorph
            as="h1"
            className="text-xl sm:text-2xl font-bold text-bronze"
            transition={{
              type: "spring",
              stiffness: 250,
              damping: 20,
              mass: 0.5,
            }}
          >
            {headerText}
          </TextMorph>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth("prev")}
              className="p-1.5 sm:p-2 rounded-full  transition-colors flex-shrink-0 text-bronze"
              aria-label="Previous month"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex gap-1 sm:gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger className="text-sm font-medium  transition-colors text-bronze font-mono">
                  {monthNames[currentDate.getMonth()]}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="bg-sand">
                  {monthNames.map((month, index) => (
                    <DropdownMenuItem
                      key={month}
                      className={
                        currentDate.getMonth() === index
                          ? "bg-gold/60 text-bronze"
                          : "text-bronze"
                      }
                      onClick={() => handleMonthChange(index.toString())}
                    >
                      <span>{month}</span>
                      {currentDate.getMonth() === index && (
                        <Check size={14} className="ml-auto" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger className="text-sm font-medium  transition-colors text-bronze">
                  {currentDate.getFullYear()}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="bg-sand">
                  {years.map((year) => (
                    <DropdownMenuItem
                      key={year}
                      className={
                        currentDate.getFullYear() === year
                          ? "bg-gold/60 text-bronze"
                          : "text-bronze"
                      }
                      onClick={() => handleYearChange(year.toString())}
                    >
                      <span>{year}</span>
                      {currentDate.getFullYear() === year && (
                        <Check size={14} className="ml-auto" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <button
              onClick={() => navigateMonth("next")}
              className="p-1.5 sm:p-2 rounded-full  transition-colors flex-shrink-0 text-bronze"
              aria-label="Next month"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </h2>

      {/* Common Timeline Section - 只显示当前选中日期的通用事件 */}
      {selectedDateCommonEvents.length > 0 && (
        <div className="mb-6 space-y-2">
          {selectedDateCommonEvents.map((event) => {
            const theme = getThemeForAction(event.action_type);
            const IconComponent = theme.icon;

            return (
              <div
                key={event.id}
                className="flex items-center justify-between gap-2 p-2 bg-sand rounded-md text-sm border-l-4 shadow-sm w-full border-gold"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-5 h-5 rounded-full bg-gold text-bronze flex items-center justify-center flex-shrink-0`}
                  >
                    <IconComponent size={10} />
                  </div>
                  <span className="font-medium text-black">{event.title}</span>
                </div>
                <span className="text-xs text-bronze/70 block ">
                  {getTimeframe(event.start_date, event.end_date)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-bronze py-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="relative overflow-hidden" style={{ height: "350px" }}>
        <AnimatePresence initial={false} custom={slideDirection} mode="sync">
          <motion.div
            key={`${currentDate.getFullYear()}-${currentDate.getMonth()}`}
            custom={slideDirection}
            variants={gridVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { duration: 0.3, ease: "easeInOut" },
              opacity: { duration: 0.2 },
            }}
            className="grid grid-cols-7 gap-1 absolute w-full top-0 left-0"
          >
            {days.map((day, index) => {
              const isSelected = isSelectedDate(day);
              const dateHasSchoolEvents = hasSchoolEvents(day);
              const hasLorEvents = hasRecommendationLetterEvents(day);
              const hasDocEvents = hasDocumentAttachmentEvents(day);
              const commonTimelineColor = getCommonTimelineColorForDate(day);
              const schoolEvents = day ? getSchoolEventsForDate(day) : [];
              const eventImage = getEventImageForDate(day);

              return (
                <motion.div
                  key={index}
                  custom={index}
                  variants={dayCellVariants}
                  initial="initial"
                  animate="animate"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => day && updateSelectedDate(day)}
                  className={`
                    aspect-square flex flex-col items-center justify-start p-1 rounded-lg relative
                    ${day ? "cursor-pointer" : "bg-sand/5"}
                    ${day ? "bg-sand/10" : ""}
                    ${isSelected ? "bg-gold/40" : ""}
                    ${day ? "border border-sand/30" : ""}
                  `}
                >
                  {/* Date number - hidden when selected */}
                  <AnimatePresence>
                    {!(isSelected && (eventImage || true)) && (
                      <motion.span
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-sm mb-1 text-bronze"
                      >
                        {day?.getDate()}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* 事件指示器容器 - hidden when selected */}
                  <AnimatePresence>
                    {day &&
                      (dateHasSchoolEvents || hasLorEvents || hasDocEvents) &&
                      !(isSelected && (eventImage || true)) && (
                        <motion.div
                          initial={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute top-6 left-0 right-0 flex justify-center space-x-1"
                        >
                          {/* 截止日期指示器 */}
                          {dateHasSchoolEvents && (
                            <div className="h-1 w-4 rounded-full bg-tomato"></div>
                          )}

                          {/* 推荐信里程碑指示器 */}
                          {hasLorEvents && (
                            <div className="h-1 w-4 rounded-full bg-grass"></div>
                          )}

                          {/* 文档附件指示器 */}
                          {hasDocEvents && (
                            <div className="h-1 w-4 rounded-full bg-skyblue"></div>
                          )}
                        </motion.div>
                      )}
                  </AnimatePresence>

                  {isSelected && eventImage && (
                    <motion.div
                      layoutId="selected-date-overlay"
                      className="absolute inset-0 bg-gold/40 rounded-lg flex items-center justify-center border border-bronze/30"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        className="relative w-10 h-10"
                      >
                        <Image
                          src={eventImage}
                          alt="Event"
                          fill
                          priority
                          quality={90}
                          className="object-contain"
                          key={`event-image-${eventImage}`}
                        />
                      </motion.div>
                    </motion.div>
                  )}
                  {isSelected && !eventImage && (
                    <motion.div
                      layoutId="selected-date-overlay"
                      className="absolute inset-0 bg-gold/40 rounded-lg flex items-center justify-center border border-bronze/30"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        className="relative w-10 h-10"
                      >
                        <Image
                          src="/images/cal/stamp.png"
                          alt="Selected"
                          fill
                          priority
                          quality={90}
                          className="object-contain"
                          key="default-stamp-image"
                        />
                      </motion.div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {selectedDate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-lg font-medium mb-4 text-black">
            {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </h2>

          {loading ? (
            <div className="flex justify-center py-4">
              <LoadingCard message="Loading events..." />
            </div>
          ) : selectedDateEvents.length === 0 ? (
            <p className="text-bronze/70 text-center py-4 bg-sand rounded-xl">
              No events scheduled for this day
            </p>
          ) : (
            <div className="space-y-3">
              {selectedDateEvents.map((event) => (
                <EventItem key={event.id} event={event} />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Calendar />
    </Suspense>
  );
}
