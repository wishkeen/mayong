import React, { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { LanguageProvider } from '@/lib/LanguageContext';
import { BrandingProvider } from '@/lib/BrandingContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { getAuthCallbackError, getUrlWithoutAuthError } from '@/lib/authCallbackError';
import ScrollToTop from './components/ScrollToTop';
// Add page imports here
import Home from '@/pages/Home';
import Browse from '@/pages/Browse';
import RitualDetail from '@/pages/RitualDetail';
import RitualPlayer from '@/pages/RitualPlayer';
import Completion from '@/pages/Completion';
import MyRituals from '@/pages/MyRituals';
import Journal from '@/pages/Journal';
import Journey from '@/pages/Journey';
import Profile from '@/pages/Profile';
import Admin from '@/pages/Admin';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Mfa from '@/pages/Mfa';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import { Navigate } from 'react-router-dom';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [callbackError, setCallbackError] = useState(null);

  useEffect(() => {
    const error = getAuthCallbackError(window.location.href);
    if (!error) return;

    setCallbackError(error);
    navigate(getUrlWithoutAuthError(window.location.href), { replace: true });
  }, [location.key, navigate]);

  if (callbackError) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
        <section className="w-full max-w-xl rounded-2xl border border-border bg-card p-8 shadow-sm" role="alert">
          <h1 className="text-2xl font-semibold text-foreground">{callbackError.title}</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{callbackError.message}</p>
          {callbackError.steps.length > 0 && (
            <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm leading-6 text-foreground">
              {callbackError.steps.map((step) => <li key={step}>{step}</li>)}
            </ol>
          )}
          <Link
            to="/login"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Back to login
          </Link>
        </section>
      </main>
    );
  }

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError?.type === 'config_error') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-4">
        <section className="max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-sm" role="alert">
          <h1 className="text-2xl font-semibold text-foreground">Supabase configuration required</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{authError.message}</p>
        </section>
      </main>
    );
  }

  if (authError?.type === 'profile_error') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-4">
        <section className="max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-sm" role="alert">
          <h1 className="text-2xl font-semibold text-foreground">Account connection issue</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{authError.message}</p>
        </section>
      </main>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/mfa" element={<Mfa />} />

      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/browse/:category" element={<Browse />} />
        <Route path="/ritual/:id" element={<RitualDetail />} />
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          <Route path="/my-rituals" element={<MyRituals />} />
          <Route path="/journey" element={<Journey />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/player/:id" element={<RitualPlayer />} />
        <Route path="/completion/:sessionId" element={<Completion />} />
        <Route path="/admin" element={<Admin />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <LanguageProvider>
        <QueryClientProvider client={queryClientInstance}>
          <BrandingProvider>
            <Router>
              <ScrollToTop />
              <AuthenticatedApp />
            </Router>
          </BrandingProvider>
          <Toaster />
        </QueryClientProvider>
      </LanguageProvider>
    </AuthProvider>
  )
}

export default App