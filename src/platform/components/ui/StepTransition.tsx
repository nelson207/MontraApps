import { useState, type ReactNode } from "react";

type Direction = "none" | "forward" | "back";

// Wizard step content (every Montra wizard): when the step changes, the new one fades in, sliding
// from the right going forward and from the left going back (styles: app-step-transition in
// platform/styles/forms.scss). Nothing moves on first display. Steps can come and go, so a step keeps
// its content (and whatever is open in it) while only its position changes.
function StepTransition({ id, index, children }: { id: string; index: number; children: ReactNode }) {
  const [shown, setShown] = useState<{ id: string; index: number; direction: Direction }>({ id, index, direction: "none" });
  if (shown.id !== id || shown.index !== index) {
    setShown({ id, index, direction: shown.id === id ? shown.direction : index > shown.index ? "forward" : "back" });
  }

  return (
    <div key={id} className={`app-step-transition is-${shown.direction}`}>
      {children}
    </div>
  );
}

export default StepTransition;
