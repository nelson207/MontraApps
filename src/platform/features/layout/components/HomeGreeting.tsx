import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@platform/features/auth/hooks/useCurrentUser";

const partOfDay = (hour: number) => (hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening");

// Top of every app's home page: today's date over "Good evening, Ana" (the user's first name).
function HomeGreeting() {
  const { t, i18n } = useTranslation("layout");
  const { name } = useCurrentUser();
  const now = new Date();
  const date = new Intl.DateTimeFormat(i18n.resolvedLanguage, { weekday: "long", day: "numeric", month: "long" }).format(now);

  return (
    <header className="app-page-header">
      <p className="app-page-eyebrow">{date}</p>
      <h1 className="app-page-title">{t(`home.${partOfDay(now.getHours())}`, { name: name.split(" ")[0] })}</h1>
    </header>
  );
}

export default HomeGreeting;
