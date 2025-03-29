import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ChatPerson } from "./types";
import { chatPersons } from "./chatPersons";
import { NotificationToggle } from "./NotificationToggle";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

type ChatHeaderProps = {
  selectedPerson: ChatPerson;
  onPersonChange: (person: ChatPerson) => void;
  messagesCount: number;
  allChatPersons?: ChatPerson[]; // Add support for all chat persons including real mentors
  userId?: string; // 当前用户ID
  fcmToken: string | null; // FCM令牌
  notificationPermissionStatus: NotificationPermission | null; // 通知权限状态
};

export function ChatHeader({
  selectedPerson,
  onPersonChange,
  messagesCount,
  allChatPersons = chatPersons,
  userId,
  fcmToken,
  notificationPermissionStatus
}: ChatHeaderProps) {
  return (
    <header className="sticky top-0 z-10 w-full p-4 flex items-center justify-between border-b bg-background">
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 focus:outline-none">
            <div className="w-10 h-10 flex items-center justify-center overflow-hidden rounded-full">
              {selectedPerson.avatar ? (
                <img
                  src={selectedPerson.avatar}
                  alt={selectedPerson.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className={`w-full h-full flex items-center justify-center ${
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
            </div>
            <div className="flex items-center gap-1">
              <h1 className="text-xl font-bold">{selectedPerson.name}</h1>
              <ChevronDown className="h-4 w-4 text-gray-500 ml-1" />
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-60 max-h-[400px] overflow-y-auto">
            {/* Filter out resume-editor and group real mentors */}
            {allChatPersons
              .filter(person => person.id !== "resume-editor")
              .map((person) => (
              <DropdownMenuItem
                key={person.id}
                onClick={() => onPersonChange(person)}
                className={`flex items-center gap-2 ${
                  selectedPerson.id === person.id ? "bg-gray-50" : ""
                }`}
              >
                <div className="w-8 h-8 flex items-center justify-center overflow-hidden rounded-full">
                  {person.avatar ? (
                    <img
                      src={person.avatar}
                      alt={person.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className={`w-full h-full flex items-center justify-center ${
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
                </div>
                <span className="text-sm font-medium truncate">{person.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
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
      </div>
    </header>
  );
}