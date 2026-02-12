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
import LogoutButton from "../auth/logout";

export default function TopBar({
  userName = "John",
  avatarUrl = "https://i.pravatar.cc/40",
  onLogout = () => {},
}) {
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
    <Navbar bg="light" className="h-100 w-100 border-bottom shadow-sm">
      <Container fluid className="px-3">
        <Navbar.Brand as={NavLink} to="/home" className="fw-semibold">
          Point of Sale
        </Navbar.Brand>

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
