import type { DriftLevel } from "@/lib/types";

const config: Record<
  DriftLevel,
  { label: string; classes: string; dot: string }
> = {
  solid: {
    label: "Solid",
    classes: "bg-solid-bg text-solid border border-solid-border",
    dot: "bg-solid",
  },
  "light-drift": {
    label: "Light Drift",
    classes: "bg-light-drift-bg text-light-drift border border-light-drift-border",
    dot: "bg-light-drift",
  },
  noticeable: {
    label: "Noticeable Drift",
    classes: "bg-noticeable-bg text-noticeable border border-noticeable-border",
    dot: "bg-noticeable",
  },
  friction: {
    label: "Friction Risk",
    classes: "bg-friction-bg text-friction border border-friction-border",
    dot: "bg-friction",
  },
};

export default function DriftBadge({
  level,
  size = "md",
}: {
  level: DriftLevel;
  size?: "sm" | "md" | "lg";
}) {
  const { label, classes, dot } = config[level];
  const sizes = {
    sm: "text-xs px-2 py-0.5 gap-1.5",
    md: "text-sm px-3 py-1 gap-2",
    lg: "text-base px-4 py-1.5 gap-2",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium tracking-wide ${classes} ${sizes[size]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
