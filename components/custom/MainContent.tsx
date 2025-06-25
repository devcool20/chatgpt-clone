"use client";
import React from "react";

import { useSidebar } from "./history";

export default function MainContent({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSidebar();
  return (
    <div className={isOpen ? "ml-72 transition-all" : "ml-16 transition-all"}>
      <div className="flex flex-col min-h-screen w-full">
        {children}
      </div>
    </div>
  );
} 