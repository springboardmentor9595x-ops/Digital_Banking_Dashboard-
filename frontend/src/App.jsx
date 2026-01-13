import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Accounts from "./components/Accounts";
import CreateAccount from "./pages/CreateAccount";
import TransactionsPage from "./pages/TransactionsPage";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/create" element={<CreateAccount />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
