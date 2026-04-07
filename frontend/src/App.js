import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import LeadsTable from './components/LeadsTable';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/leads" element={<LeadsTable />} />
            <Route path="/survey" element={<div>Survey Page (Coming Soon)</div>} />
            <Route path="/proposal" element={<div>Proposal Page (Coming Soon)</div>} />
            <Route path="/installation" element={<div>Installation Page (Coming Soon)</div>} />
            <Route path="/settings" element={<div>Settings Page (Coming Soon)</div>} />
          </Routes>
        </Layout>
      </Router>
  );
}

export default App;
