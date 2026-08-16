
import './App.css'
import { BrowserRouter,Routes,Route } from 'react-router-dom'
import SidebarLayout from './layout/SidebarLayout'
import PosLayout from './layout/PosLayout'
import Dashboard from './pages/Dashboard/Dashboard'
import SaleEntry from './pages/Sales/SaleEntry'
import Stock from './pages/Products/Stock'
function App() {

return(
      <BrowserRouter>

      <Routes>

        {/* Normal Application Layout */}
        <Route element={<SidebarLayout />}>

          <Route
            path="/"
            element={<Dashboard />}
          />

          <Route
            path="/stock"
            element={<Stock />}
          />

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
