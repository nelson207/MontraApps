import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@platform/app/store";
import {
  markAllNotificationsRead,
  markNotificationRead,
  selectNotifications,
  selectUnreadCount,
  type AppNotification,
} from "@platform/features/notifications/notificationsSlice";
import { useDropdown } from "@platform/hooks/useDropdown";
import { formatRelativeTime } from "@platform/utils/formatRelativeTime";

const MAX_ITEMS = 5;

function NotificationsMenu() {
  const { t, i18n } = useTranslation("layout");
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const notifications = useAppSelector(selectNotifications);
  const unreadCount = useAppSelector(selectUnreadCount);
  const { ref, isOpen, toggle, close } = useDropdown();

  const openNotification = (notification: AppNotification) => {
    dispatch(markNotificationRead(notification.id));
    close();
    if (notification.link) navigate(notification.link);
  };

  return (
    <div ref={ref} className="dropdown">
      <button
        type="button"
        className="app-topbar-btn position-relative"
        aria-label={unreadCount ? t("notificationsMenu.labelUnread", { count: unreadCount }) : t("notificationsMenu.label")}
        aria-expanded={isOpen}
        onClick={toggle}
      >
        <i className="bi bi-bell fs-5" />
        {unreadCount > 0 && (
          <span className="badge rounded-pill bg-danger position-absolute top-0 start-100 translate-middle">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <div
        className={`dropdown-menu dropdown-menu-end app-notifications-menu shadow border-0 p-0 overflow-hidden ${isOpen ? "show" : ""}`}
        data-bs-popper="static"
      >
        <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
          <h6 className="mb-0 fw-semibold">{t("notificationsMenu.title")}</h6>
          <button
            type="button"
            className="btn btn-link btn-sm text-decoration-none p-0"
            disabled={unreadCount === 0}
            onClick={() => dispatch(markAllNotificationsRead())}
          >
            {t("notificationsMenu.markAllRead")}
          </button>
        </div>

        {notifications.length === 0 ? (
          <p className="text-body-secondary small text-center py-4 mb-0">
            {t("notificationsMenu.caughtUp")}
          </p>
        ) : (
          <div className="list-group list-group-flush">
            {notifications.slice(0, MAX_ITEMS).map((notification) => (
              <button
                key={notification.id}
                type="button"
                className="list-group-item list-group-item-action d-flex gap-3 py-3"
                onClick={() => openNotification(notification)}
              >
                <span
                  className={`app-notification-icon bg-${notification.variant}-subtle text-${notification.variant}-emphasis`}
                >
                  <i className={`bi ${notification.icon}`} />
                </span>
                <span className="flex-grow-1 text-start">
                  <span
                    className={`d-block small ${notification.read ? "" : "fw-semibold"}`}
                  >
                    {notification.title}
                  </span>
                  <span className="d-block small text-body-secondary">
                    {notification.message}
                  </span>
                  <span className="d-block small text-body-tertiary mt-1">
                    {formatRelativeTime(notification.createdAt, i18n.resolvedLanguage, t("notificationsMenu.justNow"))}
                  </span>
                </span>
                {!notification.read && (
                  <span className="app-unread-dot" aria-label={t("notificationsMenu.unread")} />
                )}
              </button>
            ))}
          </div>
        )}

        <Link
          to="/notifications"
          className="d-block text-center small fw-semibold py-2 border-top text-decoration-none"
          onClick={close}
        >
          {t("notificationsMenu.viewAll")}
        </Link>
      </div>
    </div>
  );
}

export default NotificationsMenu;
