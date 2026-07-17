import { Routes, Route } from "react-router-dom";
import Home from "./features/home/pages/home";
import Quotation from "./features/credoper/pages/quotation";
import Dashboard from "./features/dashboard/pages/dashboard";
import News from "./features/news/pages/newsPage";
import SearchOperations from "./features/search/pages/searchOperations";
import Proposal from "./features/credoper/pages/proposal";
import Login from "./features/auth/pages/login";
import ProtectedRoute from "./app/routes/protectedRoute";
import SetupAuthenticatorPage from "./features/auth/twofactor/pages/setupAuthenticatorPage";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Home />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/news" element={<News />} />
            <Route path="/news/:id" element={<News />} />
            <Route path="/search" element={<SearchOperations />} />
            <Route path="/quotation" element={<Quotation />} />
            <Route path="/proposal" element={<Proposal />} />
            <Route path="/authsetup" element={<SetupAuthenticatorPage />} />
          </Route>
        </Route>

        <Route path="*" element={<h2>Not Found</h2>} />
      </Routes>
    </>
  );
}

export default App;
