import type { ReactNode } from "react";
import { matchRanges } from "../newsModel";

// Marks the search matches in `text` (accent-insensitive) with Bootstrap's <mark>.
function Highlight({ text, query }: { text: string; query: string }) {
  const ranges = matchRanges(text, query);
  if (ranges.length === 0) return <>{text}</>;

  const chars = [...text];
  const parts: ReactNode[] = [];
  let cursor = 0;
  ranges.forEach(([start, end], i) => {
    if (start > cursor) parts.push(chars.slice(cursor, start).join(""));
    parts.push(
      <mark key={i} className="px-0">
        {chars.slice(start, end).join("")}
      </mark>,
    );
    cursor = end;
  });
  if (cursor < chars.length) parts.push(chars.slice(cursor).join(""));

  return <>{parts}</>;
}

export default Highlight;
