import React, { lazy, Suspense, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster"
import { Button } from "@/components/ui/button";
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { LanguageProvider } from '@/lib/LanguageContext';
import { BrandingProvider, useBranding } from '@/lib/BrandingContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { getAuthCallbackError, getUrlWithoutAuthError } from '@/lib/authCallbackError';
import AuthLayout from '@/components/AuthLayout';
import ScrollToTop from './components/ScrollToTop';
// Add page imports here
const Home = lazy(() => import("@/pages/Home"));
const Browse = lazy(() => import("@/pages/Browse"));
const RitualDetail = lazy(() => import("@/pages/RitualDetail"));
const RitualPlayer = lazy(() => import("@/pages/RitualPlayer"));
const Completion = lazy(() => import("@/pages/Completion"));
const MyRituals = lazy(() => import("@/pages/MyRituals"));
const Journal = lazy(() => import("@/pages/Journal"));
const Journey = lazy(() => import("@/pages/Journey"));
const Profile = lazy(() => import("@/pages/Profile"));
const Admin = lazy(() => import("@/pages/Admin"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const Mfa = lazy(() => import("@/pages/Mfa"));
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import { Navigate } from 'react-router-dom';
import TranslatedText from '@/components/TranslatedText';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const { loading: isLoadingBranding } = useBranding();
  const location = useLocation();
  const navigate = useNavigate();
  const [callbackError, setCallbackError] = useState(null);

  useEffect(() => {
    const error = getAuthCallbackError(window.location.href);
    if (!error) return;

    setCallbackError(error);
    navigate(getUrlWithoutAuthError(window.location.href), { replace: true });
  }, [location.key, navigate]);

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth || isLoadingBranding) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#08070D]" role="status" aria-live="polite">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#D6B56A]/30 border-t-[#D6B56A]" />
        <span className="sr-only"><TranslatedText>Loading app settings…</TranslatedText></span>
      </div>
    );
  }

  if (callbackError) {
    return (
      <AuthLayout title={callbackError.title} subtitle={callbackError.message} variant="focused">
        <p className="mb-5 text-center text-sm text-muted-foreground">
          <TranslatedText>Your account is safe. You can return to the app or try signing in again.</TranslatedText>
        </p>
        <Button asChild className="h-12 w-full">
          <Link to="/login"><TranslatedText>Try again</TranslatedText></Link>
        </Button>
      </AuthLayout>
    );
  }

  if (authError?.type === 'config_error') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-4">
        <section className="max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-sm" role="alert">
          <h1 className="text-2xl font-semibold text-foreground"><TranslatedText>Supabase configuration required</TranslatedText></h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{authError.message}</p>
        </section>
      </main>
    );
  }

  if (authError?.type === 'profile_error') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-4">
        <section className="max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-sm" role="alert">
          <h1 className="text-2xl font-semibold text-foreground"><TranslatedText>Account connection issue</TranslatedText></h1>
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
    <Suspense
      fallback={
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#08070D]" role="status" aria-live="polite">
          <div className="flex items-center gap-3 text-sm text-[#AAA5B5]">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#D6B56A]/30 border-t-[#D6B56A]" />
            <TranslatedText>Loading page…</TranslatedText>
          </div>
        </div>
      }
    >
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
    </Suspense>
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