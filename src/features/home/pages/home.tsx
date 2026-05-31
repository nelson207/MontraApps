import { NavLink, Outlet } from "react-router-dom";

import logo from "../../../assets/logo.svg";
import { Image } from "react-bootstrap";
import VerticalLeftNavBar from "../../../components/navigation/verticalLeftNavBar";
import HorizontalTopNavBar from "../../../components/navigation/horizontalTopNavBar";

const SIDEBAR_WIDTH = 200;
const NAVBAR_HEIGHT = 75;

function Home() {
  return (
    <>
      <aside
        className="border-end position-fixed bg-primary sidebar text-white"
        style={{
          width: SIDEBAR_WIDTH,
          height: "100vh",
          top: 0,
          left: 0,
          overflowY: "auto",
        }}
      >
        <div
          className="d-flex align-items-center px-3"
          style={{ height: NAVBAR_HEIGHT }}
        >
          <NavLink to="/dashboard">
            <Image
              src={logo}
              alt="Logo"
              style={{ height: NAVBAR_HEIGHT, width: "100%" }}
            />
          </NavLink>
        </div>

        <div
          className="p-2 text-white"
          style={{
            minHeight: `calc(100% - ${NAVBAR_HEIGHT}px)`,
          }}
        >
          <VerticalLeftNavBar />
        </div>
      </aside>
      {/* Top navbar: full width minus sidebar, aligned to the right */}
      <div
        className=""
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
        className="p-1"
        style={{
          marginLeft: SIDEBAR_WIDTH,
          marginTop: NAVBAR_HEIGHT,
          minHeight: `calc(100% - ${NAVBAR_HEIGHT}px)`,
        }}
      >
        <Outlet />
      </main>
    </>
  );
}

export default Home;
