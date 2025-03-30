"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { FileText, Award, BookOpen, FileCode, Wrench } from "lucide-react";

export default function ToolsPage() {
  const tools = [
    {
      name: "LoR",
      fullName: "Letter of Recommendation",
      icon: Award,
      href: "/tools/lor",
      description: "Create and manage recommendation letters",
      color: "bg-sand",
      iconColor: "text-bronze",
    },
    {
      name: "Resume",
      fullName: "Resume Builder",
      icon: FileText,
      href: "/tools/resume",
      description: "Build and optimize your resume",
      color: "bg-sand",
      iconColor: "text-bronze",
    },
    {
      name: "SoP",
      fullName: "Statement of Purpose",
      icon: BookOpen,
      href: "/tools/sop",
      description: "Create compelling statements of purpose",
      color: "bg-sand",
      iconColor: "text-bronze",
    },
    {
      name: "PHS",
      fullName: "Personal History Statement",
      icon: FileCode,
      href: "/tools/phs",
      description: "Craft your personal history statement",
      color: "bg-sand",
      iconColor: "text-bronze",
    },
  ];

  return (
    <div className="p-4 flex flex-col gap-4 bg-yellow">
      <h2 className="text-lg font-bold bg-gold py-4 z-10 text-bronze rounded-lg px-4 shadow-sm mb-4 flex items-center gap-2">
        <Wrench className="w-5 h-5 text-bronze" />
        Tools
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {tools.map((tool) => (
          <Link key={tool.name} href={tool.href}>
            <motion.div
              whileTap={{ scale: 0.95 }}
              className={`rounded-xl ${tool.color} p-4 h-full flex flex-col justify-between shadow-sm border border-bronze/20`}
            >
              <div className={`${tool.iconColor} mb-2`}>
                <tool.icon size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-black">{tool.name}</h3>
                <p className="text-xs text-cement">{tool.fullName}</p>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}