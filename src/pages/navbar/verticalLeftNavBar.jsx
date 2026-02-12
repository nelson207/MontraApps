import Nav from "react-bootstrap/Nav";
import { NavLink } from "react-router-dom";

function VerticalLeftNavBar() {
  const linkClass = ({ isActive }) =>
    `nav-link rounded px-3 py-2 ${isActive ? "active bg-primary text-white" : "text-dark"}`;

  return (
    <Nav className="flex-column menu gap-1">
      <NavLink to="/dashboard" className={linkClass} end>
        Home
      </NavLink>

      <NavLink to="/news" className={linkClass}>
        News
      </NavLink>

      <NavLink to="/search" className={linkClass}>
        Search
      </NavLink>

      <NavLink to="/quotation" className={linkClass}>
        Quotation
      </NavLink>
    </Nav>
  );
}

export default VerticalLeftNavBar;
