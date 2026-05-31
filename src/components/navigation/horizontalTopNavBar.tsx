import { useMemo } from "react";
import {
  NavDropdown,
  Navbar,
  Container,
  Nav,
  Badge,
  Image,
  Dropdown,
} from "react-bootstrap";
import { NavLink } from "react-router-dom";
import { Bell } from "react-bootstrap-icons";
import type { JwtPayload } from "jwt-decode";
import { jwtDecode } from "jwt-decode";
import LogoutButton from "../../features/auth/pages/logout";

function TopBar({ avatarUrl = "https://i.pravatar.cc/40" }) {
  const NAME_CLAIM =
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name" as const;

  const { userName } = useMemo(() => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    type CustomJwtPayload = JwtPayload & {
      [NAME_CLAIM]?: string;
    };

    if (!token) return { userName: "Guest" };

    try {
      const decoded = jwtDecode<CustomJwtPayload>(token);
      const userName = decoded[NAME_CLAIM] ?? "";
      return { userName };
    } catch (error) {
      console.error("Failed to decode token:", error);
      return { userName: "User" };
    }
  }, []);

  // ✅ 3 example notifications
  const notifications = useMemo(
    () => [
      { id: 1, text: "New quotation request received" },
      { id: 2, text: "Search operation completed" },
      { id: 3, text: "News feed updated" },
    ],
    [],
  );

  const notificationsCount = notifications.length;

  return (
    <Navbar className="h-100 w-100">
      <Container fluid className="px-3">
        <Nav className="ms-auto align-items-center gap-3">
          <Dropdown align="end" className="no-caret">
            <Dropdown.Toggle
              as="button"
              className="btn btn-link position-relative p-2 text-decoration-none"
              aria-label="Notifications"
              style={{ lineHeight: 0 }}
            >
              <Bell size={20} />
              {notificationsCount > 0 && (
                <Badge
                  bg="danger"
                  pill
                  className="position-absolute top-0 start-100 translate-middle"
                >
                  {notificationsCount > 99 ? "99+" : notificationsCount}
                </Badge>
              )}
            </Dropdown.Toggle>

            <Dropdown.Menu style={{ minWidth: 320 }}>
              <Dropdown.Header>
                Notifications ({notificationsCount})
              </Dropdown.Header>

              {notifications.map((n) => (
                <Dropdown.Item key={n.id}>{n.text}</Dropdown.Item>
              ))}

              <Dropdown.Divider />
              <Dropdown.Item as={NavLink} to="/notifications">
                View all
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          {/* Avatar dropdown */}
          <NavDropdown
            align="end"
            id="avatar-dropdown"
            className="no-caret"
            title={
              <span className="d-inline-flex align-items-center gap-2">
                <span className="d-none d-md-inline">Welcome, {userName}</span>
                <Image
                  src={avatarUrl}
                  roundedCircle
                  width={36}
                  height={36}
                  alt="avatar"
                />
              </span>
            }
          >
            <NavDropdown.Item as={NavLink} to="/profile">
              Profile
            </NavDropdown.Item>
            <NavDropdown.Item as={NavLink} to="/settings">
              Settings
            </NavDropdown.Item>
            <NavDropdown.Divider />
            <NavDropdown.Item>
              <LogoutButton></LogoutButton>
            </NavDropdown.Item>
          </NavDropdown>
        </Nav>
      </Container>
    </Navbar>
  );
}
export default TopBar;
