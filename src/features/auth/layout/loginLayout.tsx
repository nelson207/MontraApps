import type { ReactNode } from "react";
import logo from "../../../assets/logo.svg";

type Props = {
  children: ReactNode;
};

function LoginLayout({ children }: Props) {
  return (
    <div className="container-fluid min-vh-100">
      <div className="row min-vh-100">
        <div className="col-lg-8 d-none d-lg-flex align-items-center justify-content-center bg-primary p-5">
          <img
            src={logo}
            alt="Logo"
            className="img-fluid"
            style={{
              maxWidth: "70%",
              filter: "drop-shadow(0 12px 24px rgba(0,0,0,.25))",
            }}
          />
        </div>

        <div className="col-lg-4 col-12 d-flex align-items-center justify-content-center bg-white p-4">
          <div style={{ width: "100%", maxWidth: 420 }}>{children}</div>
        </div>
      </div>
    </div>
  );
}

export default LoginLayout;
