import { NavLink, Outlet } from "react-router-dom";
import HorizontalTopNavBar from "../navbar/horizontalTopNavBar";
import VerticalLeftNavBar from "../navbar/verticalLeftNavBar";
import logo from "../../assets/react.svg";
import { Image } from "react-bootstrap";

const SIDEBAR_WIDTH = 280;
const NAVBAR_HEIGHT = 75;

function Home() {
  return (
    <>
      <aside
        className="bg-white border-end position-fixed"
        style={{
          width: SIDEBAR_WIDTH,
          height: "100vh",
          top: 0,
          left: 0,
          overflowY: "auto",
        }}
      >
        <div
          className="d-flex align-items-center px-3 border-bottom"
          style={{ height: NAVBAR_HEIGHT }}
        >
          <NavLink to="/dashboard">
            <Image src={logo} alt="Logo" style={{ height: NAVBAR_HEIGHT }} />
          </NavLink>
        </div>

        <div className="p-2">
          <VerticalLeftNavBar />
        </div>
      </aside>
      {/* Top navbar: full width minus sidebar, aligned to the right */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: SIDEBAR_WIDTH,
          width: `calc(100% - ${SIDEBAR_WIDTH}px)`,
          height: NAVBAR_HEIGHT,
          zIndex: 1030,
        }}
      >
        <HorizontalTopNavBar />
      </div>

      <main
        className="p-4"
        style={{
          marginLeft: SIDEBAR_WIDTH,
          marginTop: NAVBAR_HEIGHT,
          minHeight: "100vh",
        }}
      >
        <Outlet />
      </main>
    </>
  );
}

export default Home;
