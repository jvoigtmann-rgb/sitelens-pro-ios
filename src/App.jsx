import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Layout from './components/Layout';
import Legal from './pages/Legal';
import ThankYou from './pages/ThankYou';
import NativeAuthCallback from './pages/NativeAuthCallback';
import NativeAuthListener from './components/NativeAuthListener';
// Heavy route pages are code-split so the initial bundle stays small (mobile)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const NewInspection = lazy(() => import('./pages/NewInspection'));
const ReportView = lazy(() => import('./pages/ReportView'));
const Reports = lazy(() => import('./pages/Reports'));
const IssuesDashboard = lazy(() => import('./pages/IssuesDashboard'));
const LocationsMap = lazy(() => import('./pages/LocationsMap'));
const Settings = lazy(() => import('./pages/Settings'));
const PitchDeck = lazy(() => import('./pages/PitchDeck'));
const OnePager = lazy(() => import('./pages/OnePager'));
const Pricing = lazy(() => import('./pages/Pricing'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <NativeAuthListener />       
        <Router>
          <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/native-auth-callback" element={<NativeAuthCallback />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Public legal + post-purchase pages */}
            <Route path="/privacy" element={<Legal initialTab="privacy" />} />
            <Route path="/terms" element={<Legal initialTab="terms" />} />
            <Route path="/ThankYou" element={<ThankYou />} />

            {/* Authenticated app — every route below requires a logged-in user */}
            <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/new-inspection" element={<NewInspection />} />
                <Route path="/report/:id" element={<ReportView />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/issues" element={<IssuesDashboard />} />
                <Route path="/locations" element={<LocationsMap />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/pitch" element={<PitchDeck />} />
                <Route path="/one-pager" element={<OnePager />} />
                <Route path="*" element={<PageNotFound />} />
              </Route>
            </Route>
          </Routes>
          </Suspense>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
