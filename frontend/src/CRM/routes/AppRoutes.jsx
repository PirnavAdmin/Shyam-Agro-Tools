import { Navigate, Route, Routes } from "react-router-dom";
import "../styles/global.css";

import MainLayout from "../components/layout/Layout/MainLayout";
import { CRMProvider } from "../context/CRMContext";

import Dashboard from "../pages/Dashboard/Dashboard";
import Tickets from "../pages/Tickets/Tickets";
import Customers from "../pages/Customers/Customers";
import CallHistory from "../pages/CallHistory/CallHistory";
import Invoice from "../pages/Invoice/Invoice";
import AddInvoice from "../pages/Invoice/AddInvoice";
import InvoiceDetails from "../pages/Invoice/InvoiceDetails";

function AppRoutes() {
  return (
    <CRMProvider>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="customers" element={<Customers />} />
          <Route path="call-history" element={<CallHistory />} />
          <Route path="invoice" element={<Invoice />} />
          <Route path="invoice/add" element={<AddInvoice />} />
          <Route path="invoice/edit/:id" element={<AddInvoice />} />
          <Route path="invoice/details/:id" element={<InvoiceDetails />} />
          <Route path="*" element={<Navigate to="/crm" replace />} />
        </Route>
      </Routes>
    </CRMProvider>
  );
}

export default AppRoutes;
