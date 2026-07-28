import { Routes, Route, Navigate, BrowserRouter } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { DataProvider } from "@/data/store";
import { SessionProvider } from "@/context/session";
import { BrandingProvider } from "@/components/BrandingProvider";
import { ToastProvider } from "@/components/ui/toast";

import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Onboarding from "@/pages/Onboarding";
import Audit from "@/pages/Audit";
import Dashboard from "@/pages/Dashboard";
import Leads from "@/pages/leads/Leads";
import LeadsImport from "@/pages/leads/LeadsImport";
import LeadDetail from "@/pages/leads/LeadDetail";
import LeadForm from "@/pages/leads/LeadForm";
import Clients from "@/pages/clients/Clients";
import ClientDetail from "@/pages/clients/ClientDetail";
import Stock from "@/pages/stock/Stock";
import ProductDetail from "@/pages/stock/ProductDetail";
import Tasks from "@/pages/Tasks";
import Users from "@/pages/Users";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Simulator from "@/pages/growth/Simulator";
import Quoter from "@/pages/growth/Quoter";
import Commissions from "@/pages/growth/Commissions";
import Goals from "@/pages/growth/Goals";
import Ranking from "@/pages/growth/Ranking";
import Templates from "@/pages/growth/Templates";
import Automation from "@/pages/premium/Automation";
import AiAssist from "@/pages/premium/AiAssist";
import AiAgent from "@/pages/premium/AiAgent";
import Plans from "@/pages/Plans";
import NotFound from "@/pages/NotFound";
import WhatsAppPage from "@/pages/WhatsApp";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/leads/import" element={<LeadsImport />} />
        <Route path="/leads/new" element={<LeadForm />} />
        <Route path="/leads/:id" element={<LeadDetail />} />
        <Route path="/leads/:id/edit" element={<LeadForm />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/clients/:id" element={<ClientDetail />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/stock/:id" element={<ProductDetail />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/users" element={<Users />} />
        <Route path="/audit" element={<Audit />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/growth/simulator" element={<Simulator />} />
        <Route path="/growth/quoter" element={<Quoter />} />
        <Route path="/growth/commissions" element={<Commissions />} />
        <Route path="/growth/goals" element={<Goals />} />
        <Route path="/growth/ranking" element={<Ranking />} />
        <Route path="/growth/templates" element={<Templates />} />
        <Route path="/automation" element={<Automation />} />
        <Route path="/ai-assist" element={<AiAssist />} />
        <Route path="/ai-agent" element={<AiAgent />} />
        <Route path="/plans" element={<Plans />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <DataProvider>
      <SessionProvider>
        <BrandingProvider>
          <ToastProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </ToastProvider>
        </BrandingProvider>
      </SessionProvider>
    </DataProvider>
  );
}
