/* ============================================================
   Pager — interactive pagination strip.

   Usage:
     <Pager pages={[1, 2, 3, "…", 21]} />
   ============================================================ */
import React, { useState } from "react";

interface PagerProps {
  /** mix of page numbers and separator strings like "…" */
  pages: (number | string)[];
}

export function Pager({ pages }: PagerProps) {
  const nums = pages.filter((p): p is number => typeof p === "number");
  const [active, setActive] = useState(nums[0] ?? 1);

  const move = (dir: -1 | 1) => {
    const idx = nums.indexOf(active);
    setActive(nums[Math.min(nums.length - 1, Math.max(0, idx + dir))]);
  };

  return (
    <div className="pgr">
      <button onClick={() => move(-1)}>‹</button>
      {pages.map((p, i) =>
        typeof p === "number" ? (
          <button key={i} className={active === p ? "on" : ""} onClick={() => setActive(p)}>
            {p}
          </button>
        ) : (
          <button key={i} style={{ cursor: "default" }}>{p}</button>
        )
      )}
      <button onClick={() => move(1)}>›</button>
    </div>
  );
}
