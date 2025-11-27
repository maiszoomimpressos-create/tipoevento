import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import EventDetails from "./pages/EventDetails";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import MyTickets from "./pages/MyTickets";
import ManagerLogin from "./pages/ManagerLogin";
import ManagerDashboard from "./pages/ManagerDashboard";
import ManagerCreateEvent from "./pages/ManagerCreateEvent";
import ManagerEventsList from "./pages/ManagerEventsList";
import ManagerEditEvent from "./pages/ManagerEditEvent";
import ManagerSettings from "./pages/ManagerSettings";
import ManagerCompanyProfile from "./pages/ManagerCompanyProfile";
import ManagerNotifications from "./pages/ManagerNotifications";
import ManagerAdvancedSettings from "./pages/ManagerAdvancedSettings"; 
import ManagerPaymentSettings from "./pages/ManagerPaymentSettings"; 
import ManagerCreateWristband from "./pages/ManagerCreateWristband"; 
import ManagerWristbandsList from "./pages/ManagerWristbandsList"; 
import ManagerManageWristband from "./pages/ManagerManageWristband";
import ManagerReports from "./pages/ManagerReports";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRouteGuard from "./components/AdminRouteGuard";
import AdminMasterRouteGuard from "./components/AdminMasterRouteGuard";
import ManagerLayout from "./components/layouts/ManagerLayout";
import ClientLayout from "./components/layouts/ClientLayout";
import ForgotPassword from "./pages/ForgotPassword";
import FinalizarCompra from "./pages/FinalizarCompra";
import ScrollToTop from "./components/ScrollToTop"; // Importação do novo componente
import ManagerRegister from "./pages/ManagerRegister";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop /> {/* Adicionado aqui */}
        <Routes>
          {/* Public/Client Routes wrapped in ClientLayout */}
          <Route element={<ClientLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/events/:id" element={<EventDetails />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/tickets" element={<MyTickets />} />
            <Route path="/manager/register" element={<ManagerRegister />} /> {/* Rota para clientes se tornarem gestores */}
          </Route>
          
          {/* Auth Routes (No layout/Full screen) */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/tickets" element={<MyTickets />} />
          <Route path="/finalizar-compra" element={<FinalizarCompra />} />
          <Route path="/manager/login" element={<ManagerLogin />} />
          
          {/* Manager Routes (Protected by ManagerLayout, which handles auth/redirect) */}
          <Route element={<ManagerLayout />}>
            <Route path="/manager/dashboard" element={<ManagerDashboard />} />
            <Route path="/manager/events" element={<ManagerEventsList />} />
            <Route path="/manager/events/create" element={<ManagerCreateEvent />} />
            <Route path="/manager/events/edit/:id" element={<ManagerEditEvent />} />
            <Route path="/manager/wristbands" element={<ManagerWristbandsList />} />
            <Route path="/manager/wristbands/create" element={<ManagerCreateWristband />} /> 
            <Route path="/manager/wristbands/manage/:id" element={<ManagerManageWristband />} />
            <Route path="/manager/reports" element={<ManagerReports />} />
            <Route path="/manager/settings" element={<ManagerSettings />} />
            <Route path="/manager/settings/company-profile" element={<ManagerCompanyProfile />} />
            <Route path="/manager/settings/notifications" element={<ManagerNotifications />} />
            <Route path="/manager/settings/payment" element={<ManagerPaymentSettings />} />
          </Route>
          
          {/* Admin Master Routes (tipo_usuario_id = 1) */}
          <Route element={<AdminMasterRouteGuard />}>
            <Route element={<ManagerLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                {/* Nova rota para Admin Master acessar o cadastro de gestor */}
                <Route path="/admin/register-manager" element={<ManagerRegister />} />
                <Route path="/manager/settings/advanced" element={<ManagerAdvancedSettings />} />
            </Route>
          </Route>

          {/* Admin Routes (Protected by AdminRouteGuard) */}
          <Route element={<AdminRouteGuard />}>
            <Route element={<ManagerLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;