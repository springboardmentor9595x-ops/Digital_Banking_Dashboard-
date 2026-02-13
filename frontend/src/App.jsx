// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import LoginPage from "./pages/LoginPage";
// import RegisterPage from "./pages/RegisterPage";
// import Accounts from "./components/Accounts";
// import CreateAccount from "./pages/CreateAccount";
// import TransactionsPage from "./pages/TransactionsPage";
// import Dashboard from "./pages/Dashboard";
// import DashboardLayout from "./layouts/DashboardLayout";
// import DashboardHome from "./pages/DashboardHome";
// import AccountsPage from "./pages/AccountsPage";
// function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path="/register" element={<RegisterPage />} />
//         <Route path="/login" element={<LoginPage />} />
//         <Route path="/transactions" element={<TransactionsPage />} />
//         <Route path="/dashboard" element={<DashboardLayout />} />
//         <Route path="/accounts" element={<AccountsPage />} />
//         <Route index element={<DashboardHome />} />
//         <Route path="/create" element={<CreateAccount />} />
//       </Routes>
//     </BrowserRouter>
//   );
// }

// export default App;



import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import AccountsPage from "./pages/AccountsPage";
import TransactionsPage from "./pages/TransactionsPage";
import CreateAccount from "./pages/CreateAccount";
import BudgetsPage from "./pages/BudgetsPage"; 
import CategoryRulesPage from "./pages/CategoryRulesPage";
import Bills from "./pages/Bills";
import Rewards from "./pages/Rewards";
import Insights from "./pages/Insights";
import Alerts from "./pages/Alerts";
import Reports from "./pages/Reports";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
function App() {
  return (
    <>
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Dashboard Layout with Nested Pages */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="categories" element={<CategoryRulesPage />} />
        
          
          <Route path="budgets" element={<BudgetsPage />} />   

          <Route path="bills" element={<Bills />} />
           <Route path="rewards" element={<Rewards />} />  
          <Route path="insights" element={<Insights />} />
<Route path="alerts" element={<Alerts />} />
          <Route path="reports" element={<Reports />} />

   
        </Route>

        {/* Optional old routes */}
        <Route path="/create" element={<CreateAccount />} />
      </Routes>
    </BrowserRouter>
    {/* Toast Notifications */}
      <ToastContainer position="top-right" autoClose={3000} />
    </>
    
  );
}

export default App;
