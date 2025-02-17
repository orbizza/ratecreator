import React from "react";
import { cn } from "@ratecreator/ui/utils";

interface KbdProps {
  children: React.ReactNode;
  className?: string;
}

const Kbd: React.FC<KbdProps> = ({ children, className }) => {
  return (
    <span
      className={cn(
        "inline-block px-2 py-1 bg-gray-200 text-sm font-mono rounded shadow text-gray-900",
        className
      )}
    >
      {children}
    </span>
  );
};

export default Kbd;
