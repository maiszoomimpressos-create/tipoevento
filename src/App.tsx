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
import ManagerLogin from "./pages/ManagerLogin";
import ManagerDashboard from "./pages/ManagerDashboard";
import ManagerCreateEvent from "./pages/ManagerCreateEvent";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/manager/login" element={<ManagerLogin />} />
          <Route path="/manager/dashboard" element={<ManagerDashboard />} />
          <Route path="/manager/events/create" element={<ManagerCreateEvent />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;