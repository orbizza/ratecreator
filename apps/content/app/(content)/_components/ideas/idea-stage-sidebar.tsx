"use client";

import { cn } from "@ratecreator/ui/utils";
import {
  Lightbulb,
  FileText,
  Edit3,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import type { IdeaStage } from "@ratecreator/actions/content";

interface IdeaStageSidebarProps {
  currentStage: IdeaStage;
  onStageChange: (stage: IdeaStage) => void;
  disabled?: boolean;
}

const stages: {
  id: IdeaStage;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    id: "ROUGH_IDEA",
    label: "Rough Idea",
    description: "Title, description, topics",
    icon: Lightbulb,
  },
  {
    id: "OUTLINE",
    label: "Outline",
    description: "Structured outline",
    icon: FileText,
  },
  {
    id: "SCRIPT",
    label: "Script / Draft",
    description: "Full content development",
    icon: Edit3,
  },
  {
    id: "READY",
    label: "Ready",
    description: "Review & convert to post",
    icon: CheckCircle2,
  },
];

const stageOrder: IdeaStage[] = ["ROUGH_IDEA", "OUTLINE", "SCRIPT", "READY"];

function getStageIndex(stage: IdeaStage): number {
  return stageOrder.indexOf(stage);
}

export function IdeaStageSidebar({
  currentStage,
  onStageChange,
  disabled = false,
}: IdeaStageSidebarProps): JSX.Element {
  const currentIndex = getStageIndex(currentStage);

  return (
    <div className="w-64 border-r border-border bg-muted/30 p-4 h-full">
      <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">
        Stages
      </h3>
      <div className="space-y-2">
        {stages.map((stage, index) => {
          const isActive = stage.id === currentStage;
          const isCompleted = index < currentIndex;
          const isAccessible = index <= currentIndex + 1;
          const Icon = stage.icon;

          const handleClick = (): void => {
            onStageChange(stage.id);
          };

          return (
            <button
              className={cn(
                "w-full text-left p-3 rounded-lg transition-all duration-200 group",
                "flex items-start gap-3",
                isActive && "bg-primary/10 border border-primary/20",
                isCompleted && !isActive && "bg-green-500/10",
                !isActive && !isCompleted && isAccessible && "hover:bg-muted",
                !isAccessible && "opacity-50 cursor-not-allowed",
              )}
              disabled={disabled || !isAccessible}
              key={stage.id}
              onClick={handleClick}
              type="button"
            >
              <div
                className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                  isActive && "bg-primary text-primary-foreground",
                  isCompleted && !isActive && "bg-green-500 text-white",
                  !isActive &&
                    !isCompleted &&
                    "bg-muted-foreground/20 text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "font-medium text-sm",
                      isActive && "text-primary",
                      isCompleted &&
                        !isActive &&
                        "text-green-600 dark:text-green-400",
                      !isActive && !isCompleted && "text-muted-foreground",
                    )}
                  >
                    {stage.label}
                  </span>
                  {isActive ? (
                    <ChevronRight className="h-3 w-3 text-primary" />
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {stage.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>{Math.round(((currentIndex + 1) / stages.length) * 100)}%</span>
        </div>
        <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / stages.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
