import { useNavigate } from "react-router-dom";
import { usePostApiAuthLogoutMutation } from "../../router/apis/ArNextAPI";

function LogoutButton() {
  const navigate = useNavigate();
  const [logout, { isLoading }] = usePostApiAuthLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap(); // usually no payload needed
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="btn text-danger"
    >
      {isLoading ? "Logging out..." : "Logout"}
    </button>
  );
}

export default LogoutButton;
