"use client";

import React from "react";
import { useReveal } from "@/hooks/useReveal";

export default function SectionReveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { ref, visible } = useReveal(0.08);

  return (
    <div
      ref={ref}
      className={`transition-all duration-[900ms] ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      } ${className}`}
    >
      {children}
    </div>
  );
}
