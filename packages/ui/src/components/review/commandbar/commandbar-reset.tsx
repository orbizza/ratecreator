"use client";

import React, { useEffect } from "react";
import { useKBar } from "kbar";

interface CommandBarResetProps {
  onReset: () => void;
}

export const CommandBarReset: React.FC<CommandBarResetProps> = ({
  onReset,
}) => {
  const { visualState } = useKBar((state) => ({
    visualState: state.visualState,
  }));

  useEffect(() => {
    if (visualState === "hidden") {
      onReset();
    }
  }, [visualState, onReset]);

  return null;
};
