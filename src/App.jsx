import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./router/routes/protectedroute";
import Login from "./pages/auth/login";
import Home from "./pages/home/home";
import News from "./pages/operation/news";
import SearchOperations from "./pages/operation/searchOperations";
import Quotation from "./pages/operation/quotation";
import Dashboard from "./pages/operation/dashboard";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Home />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/news" element={<News />} />
          <Route path="/search" element={<SearchOperations />} />
          <Route path="/quotation" element={<Quotation />} />
        </Route>
      </Route>

      <Route path="*" element={<h2>Not Found</h2>} />
    </Routes>
  );
}

export default App;
