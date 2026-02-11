import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./router/routes/protectedroute";
import Login from "./pages/auth/login";

function App() {
  function Dashboard() {
    return <h2>Dashboard (protected)</h2>;
  }

  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>

      <Route path="*" element={<h2>Not Found</h2>} />
    </Routes>
  );
}

export default App;
