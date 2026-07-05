"use client";

import * as React from "react";
import { timeRemaining } from "@/lib/utils";

/** Renders a live countdown only after mount to avoid hydration mismatch. */
export function TimeLeft({ endTime, prefix }: { endTime: string; prefix?: string }) {
  const [label, setLabel] = React.useState<string>("…");

  React.useEffect(() => {
    const update = () => setLabel(timeRemaining(endTime));
    update();
    const t = setInterval(update, 30000);
    return () => clearInterval(t);
  }, [endTime]);

  return (
    <span>
      {prefix}
      {label}
    </span>
  );
}
