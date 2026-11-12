import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Dashboard } from './pages/Dashboard';
import { InvoiceCreator } from './pages/InvoiceCreator';
import { AllInvoices } from './pages/AllInvoices';
import { ClientsPage } from './pages/ClientsPage';
import { ServicesPage } from './pages/ServicesPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { QuotationsPage } from './pages/QuotationsPage';
import { RecurringPage } from './pages/RecurringPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { BackupPage } from './pages/BackupPage';

export const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <BrowserRouter>
      <div className="flex h-screen w-screen bg-brand-bg text-brand-text overflow-hidden font-sans">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
          <Topbar title="HypeZone Studio" />
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/invoices" element={<AllInvoices />} />
              <Route path="/invoices/new" element={<InvoiceCreator />} />
              <Route path="/invoices/create" element={<InvoiceCreator />} />
              <Route path="/invoices/edit/:id" element={<InvoiceCreator />} />
              <Route path="/recurring" element={<RecurringPage />} />
              <Route path="/quotations" element={<QuotationsPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/expenses" element={<ExpensesPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/backup" element={<BackupPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
