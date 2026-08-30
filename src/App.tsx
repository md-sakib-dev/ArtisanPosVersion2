
import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import SidebarLayout from './layout/SidebarLayout'
import PosLayout from './layout/PosLayout'
import Login from './pages/Auth/Login'
import CeoDashboard from './pages/Dashboard/CeoDashboard'
import ReportDashboard from './pages/Reports/ReportDashboard'
import PosDashboard from './pages/Dashboard/PosDashboard'
import SaleEntry from './pages/Sales/SaleEntry'
import Stock from './pages/Products/Stock'
import VoucherEntry from './pages/Sales/VoucherEntry'
import ProductReceive from './pages/Purchase/ProductReceive'
import FactoryReturn from './pages/Purchase/FactoryReturn'
import GiftVoucherReceive from './pages/Sales/GiftVoucherReceive'
import StockTransfer from './pages/Products/StockTransfer'
import VoucherTransfer from './pages/Sales/VoucherTransfer'
import SalesRefund from './pages/Sales/SalesRefund'
import StockUpdate from './pages/Products/StockUpdate'
import CustomerEntry from './pages/Customers/CustomerEntry'
import ProductManagement from './pages/Products/ProductManagement'
import CreateUser from './pages/Admin/CreateUser'
import LabelPrint from './pages/Products/LabelPrint'
import ProductReport from './pages/Reports/ProductReport'
import RoleManagement from './pages/Admin/RoleManagement'
import SalesTargetPage from './pages/Admin/SalesTargetPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Login Page (Public) */}
          <Route path="/login" element={<Login />} />

          {/* Normal Application Layout (Protected) */}
          <Route
            element={
              <ProtectedRoute>
                <SidebarLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<PosDashboard />} />
            <Route path="/reportdashboard" element={<CeoDashboard />} />
                <Route path="/reports" element={<ReportDashboard />} />
            <Route path="/stock" element={<Stock />} />
            <Route path="/voucherentry" element={<VoucherEntry />} />
            <Route path="/productreceive" element={<ProductReceive />} />
            <Route path="/factoryreturn" element={<FactoryReturn />} />
            <Route path="/giftvoucherreceive" element={<GiftVoucherReceive />} />
            <Route path="/stocktransfer" element={<StockTransfer />} />
            <Route path="/vouchertransfer" element={<VoucherTransfer />} />
            <Route path="/salesrefund" element={<SalesRefund />} />
            <Route path="/stockupdate" element={<StockUpdate />} />
            <Route path="/productmanagement" element={<ProductManagement />} />
            <Route path="/customers" element={<CustomerEntry />} />
            <Route path="/createuser" element={<CreateUser />} />
            <Route path="/labelprint" element={<LabelPrint />} />
                <Route path="/prodreport" element={<ProductReport />} />
                <Route path="/roles" element={<RoleManagement />} />
                <Route path="/salestarget" element={<SalesTargetPage />} />
           
          </Route>

          {/* POS Layout (Protected) */}
          <Route
            element={
              <ProtectedRoute>
                <PosLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/saleentry" element={<SaleEntry />} />
          
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
