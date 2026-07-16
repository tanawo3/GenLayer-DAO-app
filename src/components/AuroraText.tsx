import { motion } from "motion/react";
import React from "react";
import { cn } from "../lib/utils";

interface AuroraTextProps extends React.HTMLAttributes<HTMLElement> {
  className?: string;
  children: React.ReactNode;
  as?: React.ElementType;
}

export function AuroraText({
  className,
  children,
  as: Component = "span",
  ...props
}: AuroraTextProps) {
  const MotionComponent = motion.create(Component as any);

  return (
    <MotionComponent
      className={cn(
        "relative inline-flex bg-clip-text text-transparent",
        "bg-[linear-gradient(90deg,#9c40ff,var(--tw-gradient-stops))] from-white via-white/80 to-white/50",
        className
      )}
      style={{
        backgroundImage: "linear-gradient(to right, #ffffff, #a3a3a3, #525252, #a3a3a3, #ffffff)",
        backgroundSize: "200% auto",
      }}
      animate={{
        backgroundPosition: ["0% center", "200% center"],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "linear",
      }}
      {...props}
    >
      {children}
    </MotionComponent>
  );
}
