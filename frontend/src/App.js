import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';

// 18 CRUD pages
import BalesPage              from './pages/BalesPage';
import LoadsInPage            from './pages/LoadsInPage';
import LoadsOutPage           from './pages/LoadsOutPage';
import ContaminationLogsPage  from './pages/ContaminationLogsPage';
import CommoditiesPage        from './pages/CommoditiesPage';
import PricesPage             from './pages/PricesPage';
import CustomersPage          from './pages/CustomersPage';
import DriversPage            from './pages/DriversPage';
import VehiclesPage           from './pages/VehiclesPage';
import EquipmentPage          from './pages/EquipmentPage';
import SortationLinesPage     from './pages/SortationLinesPage';
import DowntimeEventsPage     from './pages/DowntimeEventsPage';
import OperatorsPage          from './pages/OperatorsPage';
import SafetyIncidentsPage    from './pages/SafetyIncidentsPage';
import TrainingRecordsPage    from './pages/TrainingRecordsPage';
import VendorsPage            from './pages/VendorsPage';
import ContractsPage          from './pages/ContractsPage';
import AuditLogPage           from './pages/AuditLogPage';

// 16 AI pages
import AIContaminationVisionScorePage from './pages/AIContaminationVisionScorePage';
import AICommodityPriceForecastPage   from './pages/AICommodityPriceForecastPage';
import AISortationLineBalancePage     from './pages/AISortationLineBalancePage';
import AIDowntimeRCAPage              from './pages/AIDowntimeRCAPage';
import AIExecutiveBriefPage           from './pages/AIExecutiveBriefPage';
import AICustomerQualityFeedbackPage  from './pages/AICustomerQualityFeedbackPage';
import AIVendorQuoteComparePage       from './pages/AIVendorQuoteComparePage';
import AIRoutePickupOptimizePage      from './pages/AIRoutePickupOptimizePage';
import AISafetyIncidentSummaryPage    from './pages/AISafetyIncidentSummaryPage';
import AITrainingNeedsPage            from './pages/AITrainingNeedsPage';
import AIHaulerPaymentReconPage       from './pages/AIHaulerPaymentReconPage';
import AICapacityUtilizationBriefPage from './pages/AICapacityUtilizationBriefPage';
import AIEquipmentPrognosticPage      from './pages/AIEquipmentPrognosticPage';
import AIBaleQualityGradePage         from './pages/AIBaleQualityGradePage';
import AIRegulatoryReportingPage      from './pages/AIRegulatoryReportingPage';
import AIScrapMarketBriefPage         from './pages/AIScrapMarketBriefPage';

// Admin
import WebhooksPage from './pages/WebhooksPage';

// Custom analytics views
import CustomViewsPage from './pages/CustomViewsPage';

import LoginPage from './pages/LoginPage';
import { getToken } from './services/api';

import './App.css';

function RequireAuth({ children }) {
  const location = useLocation();
  if (!getToken()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

function ShellRoutes() {
  return (
    <div className="app">
      <Sidebar />
      <main className="main" style={{ padding: 0 }}>
        <Topbar />
        <div style={{ padding: '24px 32px' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />

            {/* 18 CRUD routes */}
            <Route path="/bales"              element={<BalesPage />} />
            <Route path="/loads-in"           element={<LoadsInPage />} />
            <Route path="/loads-out"          element={<LoadsOutPage />} />
            <Route path="/contamination-logs" element={<ContaminationLogsPage />} />
            <Route path="/commodities"        element={<CommoditiesPage />} />
            <Route path="/prices"             element={<PricesPage />} />
            <Route path="/customers"          element={<CustomersPage />} />
            <Route path="/drivers"            element={<DriversPage />} />
            <Route path="/vehicles"           element={<VehiclesPage />} />
            <Route path="/equipment"          element={<EquipmentPage />} />
            <Route path="/sortation-lines"    element={<SortationLinesPage />} />
            <Route path="/downtime-events"    element={<DowntimeEventsPage />} />
            <Route path="/operators"          element={<OperatorsPage />} />
            <Route path="/safety-incidents"   element={<SafetyIncidentsPage />} />
            <Route path="/training-records"   element={<TrainingRecordsPage />} />
            <Route path="/vendors"            element={<VendorsPage />} />
            <Route path="/contracts"          element={<ContractsPage />} />
            <Route path="/audit-log"          element={<AuditLogPage />} />

            {/* 16 AI routes */}
            <Route path="/ai/contamination-vision-score" element={<AIContaminationVisionScorePage />} />
            <Route path="/ai/commodity-price-forecast"   element={<AICommodityPriceForecastPage />} />
            <Route path="/ai/sortation-line-balance"     element={<AISortationLineBalancePage />} />
            <Route path="/ai/downtime-rca"               element={<AIDowntimeRCAPage />} />
            <Route path="/ai/executive-brief"            element={<AIExecutiveBriefPage />} />
            <Route path="/ai/customer-quality-feedback"  element={<AICustomerQualityFeedbackPage />} />
            <Route path="/ai/vendor-quote-compare"       element={<AIVendorQuoteComparePage />} />
            <Route path="/ai/route-pickup-optimize"      element={<AIRoutePickupOptimizePage />} />
            <Route path="/ai/safety-incident-summary"    element={<AISafetyIncidentSummaryPage />} />
            <Route path="/ai/training-needs"             element={<AITrainingNeedsPage />} />
            <Route path="/ai/hauler-payment-recon"       element={<AIHaulerPaymentReconPage />} />
            <Route path="/ai/capacity-utilization-brief" element={<AICapacityUtilizationBriefPage />} />
            <Route path="/ai/equipment-prognostic"       element={<AIEquipmentPrognosticPage />} />
            <Route path="/ai/bale-quality-grade"         element={<AIBaleQualityGradePage />} />
            <Route path="/ai/regulatory-reporting"       element={<AIRegulatoryReportingPage />} />
            <Route path="/ai/scrap-market-brief"         element={<AIScrapMarketBriefPage />} />

            <Route path="/webhooks" element={<WebhooksPage />} />
            <Route path="/custom-views" element={<CustomViewsPage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <ShellRoutes />
            </RequireAuth>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
