import { Routes, Route, Navigate, BrowserRouter } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { RequirePermission } from "@/components/layout/RequirePermission";
import { DataProvider } from "@/data/store";
import { SessionProvider } from "@/context/session";
import { BrandingProvider } from "@/components/BrandingProvider";
import { ToastProvider } from "@/components/ui/toast";
import { TrackingProvider } from "@/components/TrackingProvider";

import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Onboarding from "@/pages/Onboarding";
import Audit from "@/pages/Audit";
import Dashboard from "@/pages/Dashboard";
import Leads from "@/pages/leads/Leads";
import Remarketing from "@/pages/leads/Remarketing";
import LeadsImport from "@/pages/leads/LeadsImport";
import LeadDetail from "@/pages/leads/LeadDetail";
import LeadForm from "@/pages/leads/LeadForm";
import Clients from "@/pages/clients/Clients";
import ClientDetail from "@/pages/clients/ClientDetail";
import Stock from "@/pages/stock/Stock";
import ProductDetail from "@/pages/stock/ProductDetail";
import Tasks from "@/pages/Tasks";
import CalendarPage from "@/pages/Calendar";
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
        <Route path="/leads" element={<RequirePermission resource="leads"><Leads /></RequirePermission>} />
        <Route path="/leads/import" element={<RequirePermission action="create" resource="leads" feature="import_leads"><LeadsImport /></RequirePermission>} />
        <Route path="/leads/new" element={<RequirePermission action="create" resource="leads"><LeadForm /></RequirePermission>} />
        <Route path="/leads/:id" element={<RequirePermission resource="leads"><LeadDetail /></RequirePermission>} />
        <Route path="/leads/:id/edit" element={<RequirePermission action="edit" resource="leads"><LeadForm /></RequirePermission>} />
        <Route path="/clients" element={<RequirePermission resource="clients"><Clients /></RequirePermission>} />
        <Route path="/clients/:id" element={<RequirePermission resource="clients"><ClientDetail /></RequirePermission>} />
        <Route path="/stock" element={<RequirePermission resource="stock"><Stock /></RequirePermission>} />
        <Route path="/stock/:id" element={<RequirePermission resource="stock"><ProductDetail /></RequirePermission>} />
        <Route path="/tasks" element={<RequirePermission resource="tasks"><Tasks /></RequirePermission>} />
        <Route path="/calendar" element={<RequirePermission resource="calendar"><CalendarPage /></RequirePermission>} />
        <Route path="/remarketing" element={<RequirePermission resource="remarketing"><Remarketing /></RequirePermission>} />
        <Route path="/whatsapp" element={<RequirePermission resource="whatsapp" feature="whatsapp"><WhatsAppPage /></RequirePermission>} />
        <Route path="/users" element={<RequirePermission resource="users"><Users /></RequirePermission>} />
        <Route path="/audit" element={<RequirePermission resource="audit" feature="view_audit"><Audit /></RequirePermission>} />
        <Route path="/reports" element={<RequirePermission resource="reports" feature="view_reports"><Reports /></RequirePermission>} />
        <Route path="/settings" element={<RequirePermission resource="settings"><Settings /></RequirePermission>} />
        <Route path="/growth/simulator" element={<Simulator />} />
        <Route path="/growth/quoter" element={<Quoter />} />
        <Route path="/growth/commissions" element={<RequirePermission resource="commissions"><Commissions /></RequirePermission>} />
        <Route path="/growth/goals" element={<Goals />} />
        <Route path="/growth/ranking" element={<Ranking />} />
        <Route path="/growth/templates" element={<RequirePermission resource="templates"><Templates /></RequirePermission>} />
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
              <TrackingProvider>
                <AppRoutes />
              </TrackingProvider>
            </BrowserRouter>
          </ToastProvider>
        </BrandingProvider>
      </SessionProvider>
    </DataProvider>
  );
}
