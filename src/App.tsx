import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import { lazy, Suspense } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedLayout from './components/ProtectedLayout';
import { RealtimeNotificationProvider } from './lib/RealtimeNotificationContext';

// --- Lazy Load Pages ---
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const AuthCallback = lazy(() => import('./components/AuthCallback'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Properties = lazy(() => import('./pages/Properties'));
const Interactions = lazy(() => import('./pages/Interactions'));
const Customers = lazy(() => import('./pages/Customers'));
const VisitPlans = lazy(() => import('./pages/VisitPlans'));
const Admins = lazy(() => import('./pages/Admins'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Vendors = lazy(() => import('./pages/Vendors'));
const Tickets = lazy(() => import('./pages/Tickets'));
const Services = lazy(() => import('./pages/Services'));
const ManagementPlans = lazy(() => import('./pages/ManagementPlans'));
const RentRecords = lazy(() => import('./pages/RentRecords'));
const RentPayments = lazy(() => import('./pages/RentPayments'));
const PropertyDetailsPage = lazy(() => import('./pages/PropertyDetailsPage'));
const OccupancyRentStatusPage = lazy(() => import('./pages/OccupancyRentStatus'));
const CustomerDetailsPage = lazy(() => import('./pages/CustomerDetailsPage'));
const MySalesVisits = lazy(() => import('./pages/MySalesVisits'));
const RentalApplications = lazy(() => import('./pages/RentalApplications'));
const HomepageSettings = lazy(() => import('./pages/HomepageSettings'));

function App() {
  return (
    <HelmetProvider>
      <Router>
        <ErrorBoundary>
          <AuthProvider>
            <RealtimeNotificationProvider>
              <Suspense fallback={
                <div className="flex items-center justify-center h-screen bg-gray-100">
                  <LoadingSpinner size={40} />
                </div>
              }>
                <Routes>
                {/* --- Public Routes --- */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/auth/callback" element={<AuthCallback />} />

                {/* --- Protected Routes --- */}
                <Route element={<ProtectedLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/properties" element={<Properties />} />
                  <Route path="/properties/:propertyId" element={<PropertyDetailsPage />} />
                  <Route path="/interactions" element={<Interactions />} />
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/customers/:userId" element={<CustomerDetailsPage />} />
                  <Route path="/visit-plans" element={<VisitPlans />} />
                  <Route path="/admins" element={<Admins />} />
                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/tickets" element={<Tickets />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/vendors" element={<Vendors />} />
                  <Route path="/management-plans" element={<ManagementPlans />} />
                  <Route path="/rent-records" element={<RentRecords />} />
                  <Route path="/rent-payments" element={<RentPayments />} />
                  <Route path="/occupancy-status" element={<OccupancyRentStatusPage />} />
                  <Route path="/my-sales-visits" element={<MySalesVisits />} />
                  <Route path="/rental-applications" element={<RentalApplications />} />
                  <Route path="/homepage-settings" element={<HomepageSettings />} />
                </Route>

                {/* --- Not Found Route --- */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </RealtimeNotificationProvider>
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  </HelmetProvider>
  );
}

export default App;