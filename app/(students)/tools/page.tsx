"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { FileText, Award, BookOpen, FileCode } from "lucide-react";

export default function ToolsPage() {
  const tools = [
    {
      name: "LoR",
      fullName: "Letter of Recommendation",
      icon: Award,
      href: "/tools/lor",
      description: "Create and manage recommendation letters",
      color: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      name: "Resume",
      fullName: "Resume Builder",
      icon: FileText,
      href: "/tools/resume",
      description: "Build and optimize your resume",
      color: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      name: "SoP",
      fullName: "Statement of Purpose",
      icon: BookOpen,
      href: "/tools/sop",
      description: "Create compelling statements of purpose",
      color: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      name: "PHS",
      fullName: "Personal History Statement",
      icon: FileCode,
      href: "/tools/phs",
      description: "Craft your personal history statement",
      color: "bg-amber-100",
      iconColor: "text-amber-600",
    },
  ];

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Tools</h1>
        <p className="text-gray-600">Boost your application process</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {tools.map((tool) => (
          <Link key={tool.name} href={tool.href}>
            <motion.div
              whileTap={{ scale: 0.95 }}
              className={`rounded-xl ${tool.color} p-4 h-full flex flex-col justify-between shadow-sm`}
            >
              <div className={`${tool.iconColor} mb-2`}>
                <tool.icon size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">{tool.name}</h3>
                <p className="text-xs text-gray-700">{tool.fullName}</p>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}