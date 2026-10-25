import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@platform/app/store";
import { formatRelativeTime } from "@platform/utils/formatRelativeTime";
import {
  markAllNotificationsRead,
  markNotificationRead,
  selectNotifications,
  selectUnreadCount,
  type AppNotification,
} from "../notificationsSlice";

type Filter = "all" | "unread";

function NotificationsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const notifications = useAppSelector(selectNotifications);
  const unreadCount = useAppSelector(selectUnreadCount);
  const [filter, setFilter] = useState<Filter>("all");

  const visible =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const open = (notification: AppNotification) => {
    dispatch(markNotificationRead(notification.id));
    if (notification.link) navigate(notification.link);
  };

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-body d-flex flex-wrap gap-2 align-items-center justify-content-between py-3">
        <ul className="nav nav-pills">
          {(["all", "unread"] as const).map((value) => (
            <li className="nav-item" key={value}>
              <button
                type="button"
                className={`nav-link ${filter === value ? "active" : ""}`}
                onClick={() => setFilter(value)}
              >
                {value === "all" ? "All" : `Unread (${unreadCount})`}
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          disabled={unreadCount === 0}
          onClick={() => dispatch(markAllNotificationsRead())}
        >
          <i className="bi bi-check2-all me-1" />
          Mark all as read
        </button>
      </div>

      {visible.length === 0 ? (
        <div className="card-body text-center text-body-secondary py-5">
          <i className="bi bi-bell-slash display-6 d-block mb-2" />
          No notifications here.
        </div>
      ) : (
        <div className="list-group list-group-flush">
          {visible.map((notification) => (
            <button
              key={notification.id}
              type="button"
              className="list-group-item list-group-item-action d-flex gap-3 py-3"
              onClick={() => open(notification)}
            >
              <span
                className={`app-notification-icon bg-${notification.variant}-subtle text-${notification.variant}-emphasis`}
              >
                <i className={`bi ${notification.icon}`} />
              </span>
              <span className="flex-grow-1 text-start">
                <span className={`d-block ${notification.read ? "" : "fw-semibold"}`}>
                  {notification.title}
                </span>
                <span className="d-block text-body-secondary">
                  {notification.message}
                </span>
              </span>
              <span className="d-flex flex-column align-items-end gap-2 flex-shrink-0">
                <small className="text-body-tertiary">
                  {formatRelativeTime(notification.createdAt)}
                </small>
                {!notification.read && (
                  <span className="app-unread-dot" aria-label="Unread" />
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;
