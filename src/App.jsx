import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { seedIfNeeded } from './database/repositories.js';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Companies from './pages/Companies.jsx';
import CompanyDetails from './pages/CompanyDetails.jsx';
import VisitForm from './pages/VisitForm.jsx';
import Visits from './pages/Visits.jsx';
import MapNavigation from './pages/MapNavigation.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';
import { useAuth } from './context/AuthContext.jsx';

export default function App() {
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState('');
  const { isAuthenticated, isAdmin, hasPermission } = useAuth();

  useEffect(() => {
    seedIfNeeded()
      .then(() => setReady(true))
      .catch((e) => setErr(e.message || 'Local storage unavailable'));
  }, []);

  if (err)
    return (
      <div className="p-10 text-red-700">
        Could not open the local database: {err}. Check that browser storage is enabled (not private mode).
      </div>
    );
  if (!ready) return <div className="p-10 text-slate2">Preparing local database…</div>;

  return (
    <Routes>
      {/* Public Login Route */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={isAdmin ? '/settings' : '/visits'} replace />
          ) : (
            <Login />
          )
        }
      />

      {/* Authenticated Workspace Routes */}
      {isAuthenticated ? (
        <Route element={<Layout />}>
          {/* Index redirect: Admin goes to settings / dashboard, Field User goes to visits */}
          <Route
            index
            element={
              isAdmin ? <Dashboard /> : <Navigate to="/visits" replace />
            }
          />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="companies" element={<Companies />} />
          <Route path="company/:id" element={<CompanyDetails />} />
          {hasPermission('canEditCompany') && (
            <Route path="company/:id/edit" element={<VisitForm mode="editCompany" />} />
          )}
          {hasPermission('canAddVisit') && (
            <Route path="company/:id/visit" element={<VisitForm mode="visit" />} />
          )}
          {hasPermission('canAddVisit') && (
            <Route path="visit/new" element={<VisitForm mode="new" />} />
          )}
          {hasPermission('canEditVisit') && (
            <Route path="visit/:visitId/edit" element={<VisitForm mode="editVisit" />} />
          )}
          <Route path="visits" element={<Visits />} />
          <Route path="map" element={<MapNavigation />} />
          {isAdmin && <Route path="reports" element={<Reports />} />}
          {isAdmin && <Route path="settings" element={<Settings />} />}
          <Route
            path="*"
            element={<Navigate to={isAdmin ? '/dashboard' : '/visits'} replace />}
          />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}
