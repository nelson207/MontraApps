import Nav from "react-bootstrap/Nav";
import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaNewspaper,
  FaSearch,
  FaFileInvoice,
  FaFileAlt,
} from "react-icons/fa";

function VerticalLeftNavBar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `nav-link text-start menu-item  ${isActive ? "active" : ""}`;

  return (
    <Nav className="flex-column menu gap-1 fs-5 pt-5">
      <NavLink to="/dashboard" className={linkClass} end>
        <FaHome className="me-2" />
        Home
      </NavLink>
      <NavLink to="/news" className={linkClass}>
        <FaNewspaper className="me-2" />
        News
      </NavLink>
      <NavLink to="/search" className={linkClass}>
        <FaSearch className="me-2" />
        Search
      </NavLink>
      <NavLink to="/quotation" className={linkClass}>
        <FaFileInvoice className="me-2" />
        Quotation
      </NavLink>
      <NavLink to="/proposal" className={linkClass}>
        <FaFileAlt className="me-2" />
        Proposal
      </NavLink>
    </Nav>
  );
}

export default VerticalLeftNavBar;
