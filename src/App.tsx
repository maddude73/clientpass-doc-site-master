import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AuthPage } from "./pages/AuthPage";
import DevDocsPage from "./pages/DevDocsPage";
import DocViewerPage from "./pages/DocViewerPage";
import ChatbotPage from "./pages/ChatbotPage";
import AIConfiguration from "./pages/AIConfiguration";
import { MainLayout } from "./components/MainLayout";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <Routes>
      {user ? (
        <>
          <Route path="/docs" element={<MainLayout><DevDocsPage /></MainLayout>} />
          <Route path="/docs/:docName" element={<MainLayout><DocViewerPage /></MainLayout>} />
          <Route path="/chatbot" element={<MainLayout><ChatbotPage /></MainLayout>} />
          <Route path="/ai-config" element={<MainLayout><AIConfiguration /></MainLayout>} />
          <Route path="*" element={<Navigate to="/docs" />} />
        </>
      ) : (
        <>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="*" element={<Navigate to="/auth" />} />
        </>
      )}
    </Routes>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_relativeSplatPath: true }}>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;