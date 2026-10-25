import { useState, type ReactNode } from "react";

type Direction = "none" | "forward" | "back";

// Wizard step content (every Montra wizard): when the step changes, the new one fades in, sliding
// from the right going forward and from the left going back (styles: app-step-transition in
// platform/styles/forms.scss). Nothing moves on first display.
function StepTransition({ index, children }: { index: number; children: ReactNode }) {
  const [shown, setShown] = useState<{ index: number; direction: Direction }>({ index, direction: "none" });
  if (shown.index !== index) {
    setShown({ index, direction: index > shown.index ? "forward" : "back" });
  }

  return (
    <div key={index} className={`app-step-transition is-${shown.direction}`}>
      {children}
    </div>
  );
}

export default StepTransition;
