import { useEffect } from "react";
import { matchPath, useLocation } from "react-router-dom";
import { APP_NAME } from "@app/brand";
import { useAppSelector } from "@platform/app/store";
import { selectUnreadCount } from "@platform/features/notifications/notificationsSlice";
import { selectTheme } from "@platform/features/theme/themeSlice";
import { applyFavicon } from "@platform/features/theme/themeUtils";

// Base tab title, e.g. "Montra Credit" (see app/brand.ts)
const BASE_TITLE = APP_NAME;

// Browser tab, WhatsApp-style: the icon in the current theme colors with a dot while
// something is unread, and the unread count in the title, e.g. "(3) Montra Credit".
// Nothing is shown on the login page: notifications belong to a signed-in user.
export function useAppFavicon(): void {
  const theme = useAppSelector(selectTheme);
  const { pathname } = useLocation();
  const isLoginPage = !!matchPath("/login", pathname);
  const unread = useAppSelector(selectUnreadCount);
  const visibleUnread = isLoginPage ? 0 : unread;

  useEffect(() => {
    applyFavicon(theme, visibleUnread > 0);
  }, [theme, visibleUnread]);

  useEffect(() => {
    document.title = visibleUnread > 0 ? `(${visibleUnread}) ${BASE_TITLE}` : BASE_TITLE;
  }, [visibleUnread]);
}
