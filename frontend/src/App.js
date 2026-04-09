import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import LeadsTable from './components/LeadsTable';
import LeadDetail from './components/LeadDetail';
import Conversions from './components/Conversions';
import Customers from './components/Customers';
import CustomerDetail from './components/CustomerDetail';
import Survey from './components/Survey';
import Installation from './components/Installation';
import Loans from './components/Loans';
import Subsidy from './components/Subsidy';
import Tasks from './components/Tasks';
import FollowUps from './components/FollowUps';
import Stock from './components/Stock';
import Products from './components/Products';
import SalesProducts from './components/SalesProducts';
import Suppliers from './components/Suppliers';
import Users from './components/Users';
import Campaigns from './components/Campaigns';
import Broadcasts from './components/Broadcasts';
import Engagement from './components/Engagement';
import Automation from './components/Automation';
import Reports from './components/Reports';
import AuditLogs from './components/AuditLogs';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/leads" element={
            <ProtectedRoute>
              <Layout>
                <LeadsTable />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/leads/:id" element={
            <ProtectedRoute>
              <Layout>
                <LeadDetail />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/conversions" element={
            <ProtectedRoute>
              <Layout>
                <Conversions />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/customers" element={
            <ProtectedRoute>
              <Layout>
                <Customers />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/customers/:id" element={
            <ProtectedRoute>
              <Layout>
                <CustomerDetail />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/survey" element={
            <ProtectedRoute>
              <Layout>
                <Survey />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/proposal" element={
            <ProtectedRoute>
              <Layout>
                <div>Proposal Page (Coming Soon)</div>
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/loans" element={
            <ProtectedRoute>
              <Layout>
                <Loans />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/subsidy" element={
            <ProtectedRoute>
              <Layout>
                <Subsidy />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/installation" element={
            <ProtectedRoute>
              <Layout>
                <Installation />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/stock" element={
            <ProtectedRoute>
              <Layout>
                <Stock />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/products" element={
            <ProtectedRoute>
              <Layout>
                <Products />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/sales-products" element={
            <ProtectedRoute>
              <Layout>
                <SalesProducts />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/suppliers" element={
            <ProtectedRoute>
              <Layout>
                <Suppliers />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <AdminRoute>
              <Layout>
                <Users />
              </Layout>
            </AdminRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Layout>
                <div>Settings Page (Coming Soon)</div>
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/tasks" element={
            <ProtectedRoute>
              <Layout>
                <Tasks />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/follow-ups" element={
            <ProtectedRoute>
              <Layout>
                <FollowUps />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/campaigns" element={
            <ProtectedRoute>
              <Layout>
                <Campaigns />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/broadcasts" element={
            <ProtectedRoute>
              <Layout>
                <Broadcasts />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/engagement" element={
            <ProtectedRoute>
              <Layout>
                <Engagement />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/automation" element={
            <ProtectedRoute>
              <Layout>
                <Automation />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute>
              <Layout>
                <Reports />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/audit-logs" element={
            <ProtectedRoute>
              <Layout>
                <AuditLogs />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Catch all - redirect to login if not authenticated */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
