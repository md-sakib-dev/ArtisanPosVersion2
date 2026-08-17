
import './App.css'
import { BrowserRouter,Routes,Route } from 'react-router-dom'
import SidebarLayout from './layout/SidebarLayout'
import PosLayout from './layout/PosLayout'
import CeoDashboard from './pages/Dashboard/CeoDashboard'
import SaleEntry from './pages/Sales/SaleEntry'
import Stock from './pages/Products/Stock'
import VoucherEntry from './pages/Sales/VoucherEntry'
import ProductReceive from './pages/Purchase/ProductReceive'
import FactoryReturn from './pages/Purchase/FactoryReturn'
import GiftVoucherReceive from './pages/Sales/GiftVoucherReceive'
import StockTransfer from './pages/Products/StockTransfer'
import VoucherTransfer from './pages/Sales/VoucherTransfer'
function App() {

return(
      <BrowserRouter>

      <Routes>

        {/* Normal Application Layout */}
        <Route element={<SidebarLayout />}>

          <Route
            path="/"
            element={<CeoDashboard />}
          />

          <Route
            path="/stock"
            element={<Stock />}
          />
          <Route path='/voucherentry' element={<VoucherEntry/>}/>
          <Route path='/productreceive' element={<ProductReceive/>}/>
          <Route path='/factoryreturn' element={<FactoryReturn/>}/>
          <Route path='/giftvoucherreceive' element={<GiftVoucherReceive/>}/>
          <Route path='/stocktransfer' element={<StockTransfer/>}/>
          <Route path='/vouchertransfer' element={<VoucherTransfer/>}/>

        </Route>


        {/* POS Layout */}
        <Route element={<PosLayout />}>

          <Route
            path="/saleentry"
            element={<SaleEntry />}
          />

        </Route>

      </Routes>

    </BrowserRouter>
)
}

export default App
