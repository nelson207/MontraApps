import { useState, type ReactNode, type SyntheticEvent } from "react";

type Props = {
  /** Line breaks ("\n") are kept */
  text: string;
  children: ReactNode;
  className?: string;
  /** Right of the element (default) or below it */
  placement?: "end" | "bottom";
  /** false hides it (e.g. while the element's menu is open) */
  enabled?: boolean;
};

// Tooltip using Bootstrap's tooltip styles.
// Fixed positioning so it isn't clipped by scrolling containers (e.g. the sidebar).
function Tooltip({ text, children, className, placement = "end", enabled = true }: Props) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(
    null,
  );

  const show = (e: SyntheticEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition(
      placement === "bottom"
        ? { top: rect.bottom, left: rect.left + rect.width / 2 }
        : { top: rect.top + rect.height / 2, left: rect.right },
    );
  };
  const hide = () => setPosition(null);

  return (
    <span
      className={className}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {position && enabled && (
        <div
          role="tooltip"
          className={`tooltip show position-fixed ${placement === "bottom" ? "bs-tooltip-bottom translate-middle-x" : "bs-tooltip-end translate-middle-y"}`}
          style={{ top: position.top, left: position.left }}
        >
          <div
            className={`tooltip-arrow position-absolute ${placement === "bottom" ? "start-50 translate-middle-x" : "top-50 translate-middle-y"}`}
          />
          <div className="tooltip-inner text-start" style={{ whiteSpace: "pre-line" }}>
            {text}
          </div>
        </div>
      )}
    </span>
  );
}

export default Tooltip;
