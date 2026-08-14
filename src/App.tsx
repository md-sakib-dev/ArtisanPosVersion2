
import Sidebar from './components/layout/Sidebar'
import './App.css'
import { BrowserRouter,Routes,Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard/Dashboard'
import SaleEntry from './pages/Sales/SaleEntry'
import Stock from './pages/Products/Stock'
function App() {

return(
  <BrowserRouter>
 <div className="min-h-screen bg-[#F5F2EA] flex">
  <Sidebar/>
      <main className="flex-1 p-6">
        <Routes>

        <Route
              path="/"
              element={<Dashboard />}
            />
            <Route path='/saleentry' element={<SaleEntry/>}/>
            <Route path='/stock' element={<Stock/>}/>

        </Routes>
      </main>
    </div>

  </BrowserRouter>
)
}

export default App
