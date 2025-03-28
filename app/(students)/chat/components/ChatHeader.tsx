import { ChevronDown, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatPerson } from "./types";
import { chatPersons } from "./chatPersons";
import { NotificationToggle } from "./NotificationToggle";

type ChatHeaderProps = {
  selectedPerson: ChatPerson;
  onPersonChange: (person: ChatPerson) => void;
  onClearChat: () => void;
  messagesCount: number;
  allChatPersons?: ChatPerson[]; // Add support for all chat persons including real mentors
  userId?: string; // 当前用户ID
  fcmToken: string | null; // FCM令牌
  notificationPermissionStatus: NotificationPermission | null; // 通知权限状态
};

// 下拉菜单动画
const dropdownVariants = {
  hidden: { opacity: 0, y: -10, height: 0 },
  visible: {
    opacity: 1,
    y: 0,
    height: "auto",
    transition: {
      duration: 0.2,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    height: 0,
    transition: {
      duration: 0.2,
    },
  },
};

export function ChatHeader({
  selectedPerson,
  onPersonChange,
  onClearChat,
  messagesCount,
  allChatPersons = chatPersons,
  userId,
  fcmToken,
  notificationPermissionStatus
}: ChatHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 处理点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-10 w-full p-4 flex items-center justify-between border-b bg-background">
      <div className="flex items-center gap-2 relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2"
        >
          {selectedPerson.avatar ? (
            <div className="w-10 h-10 overflow-hidden rounded-full">
              <img
                src={selectedPerson.avatar}
                alt={selectedPerson.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div
              className={`p-2 rounded-full ${
                selectedPerson.isRealPerson
                  ? "bg-green-100"
                  : selectedPerson.id === "phd-mentor"
                  ? "bg-purple-100"
                  : selectedPerson.id === "resume-editor"
                    ? "bg-blue-100"
                    : "bg-green-100"
              }`}
            >
              <selectedPerson.icon
                className={`h-5 w-5 ${selectedPerson.color}`}
              />
            </div>
          )}
          <div className="flex items-center gap-1">
            <h1 className="text-xl font-bold">{selectedPerson.name}</h1>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
            />
          </div>
        </button>

        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg py-2 w-60 overflow-hidden z-20 max-h-96 overflow-y-auto"
            >
              {/* Filter out resume-editor and group real mentors */}
              {allChatPersons
                .filter(person => person.id !== "resume-editor")
                .map((person) => (
                <button
                  key={person.id}
                  onClick={() => {
                    onPersonChange(person);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-left ${
                    selectedPerson.id === person.id ? "bg-gray-50" : ""
                  }`}
                >
                  {person.avatar ? (
                    <div className="w-8 h-8 overflow-hidden rounded-full">
                      <img
                        src={person.avatar}
                        alt={person.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className={`p-1 rounded-full ${
                        person.isRealPerson
                          ? "bg-green-100"
                          : person.id === "phd-mentor"
                          ? "bg-purple-100"
                          : "bg-blue-100"
                      }`}
                    >
                      <person.icon className={`h-4 w-4 ${person.color}`} />
                    </div>
                  )}
                  <span className="text-sm font-medium truncate">{person.name}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2">
        {/* 添加通知开关按钮 */}
        {selectedPerson.isRealPerson && userId && (
          <NotificationToggle
            userId={userId}
            userRole="student"
            fcmToken={fcmToken}
            notificationPermissionStatus={notificationPermissionStatus}
          />
        )}

        {messagesCount > 0 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClearChat}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors"
          >
            <Trash2 size={16} />
            <span className="hidden sm:inline">Clear</span>
          </motion.button>
        )}
      </div>
    </header>
  );
}