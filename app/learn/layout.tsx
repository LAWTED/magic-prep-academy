"use client";

import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLearnHomePage = pathname === "/learn";

  return (
    <div className="container px-4 max-w-4xl mx-auto pb-20 pt-6">
      {isLearnHomePage && (
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span>Back to Home</span>
          </Link>
          <h1 className="text-2xl font-bold mt-4">Your Learning Adventure</h1>
          <p className="text-gray-600 mt-2">
            Choose an adventure zone to continue your learning journey
          </p>
        </div>
      )}
      {children}
    </div>
  );
}