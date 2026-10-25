import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@platform/features/auth/hooks/useCurrentUser";

const partOfDay = (hour: number) => (hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening");

// Top bar, after the page title: today's date over "Good evening, Ana" (the user's first name),
// two short lines that fit the bar's height. Hidden on small screens.
function TopbarGreeting() {
  const { t, i18n } = useTranslation("layout");
  const { name } = useCurrentUser();
  const now = new Date();
  const date = new Intl.DateTimeFormat(i18n.resolvedLanguage, { weekday: "long", day: "numeric", month: "long" }).format(now);

  return (
    <div className="app-topbar-greeting d-none d-md-flex">
      <span className="app-topbar-greeting-date">{date}</span>
      <span className="app-topbar-greeting-text">
        {t(`home.${partOfDay(now.getHours())}`, { name: name.split(" ")[0] })}
      </span>
    </div>
  );
}

export default TopbarGreeting;
