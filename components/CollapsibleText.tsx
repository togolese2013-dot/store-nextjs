"use client";

import { useState } from "react";
import { clsx } from "clsx";

interface Props {
  text: string;
  maxLines?: number;
  className?: string;
}

export default function CollapsibleText({ text, maxLines = 4, className }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 280;

  return (
    <div>
      <div className={clsx(
        "text-slate-600 text-sm leading-relaxed whitespace-pre-line",
        !expanded && isLong && `line-clamp-${maxLines}`,
        className
      )}>
        {text}
      </div>
      {isLong && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="mt-2 text-sm font-semibold text-brand-700 hover:text-brand-900 transition-colors"
        >
          {expanded ? "Voir moins ↑" : "Voir la description complète ↓"}
        </button>
      )}
    </div>
  );
}
