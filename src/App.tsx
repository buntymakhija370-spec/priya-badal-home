import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ScrollToTop } from './components/ScrollToTop'
import { HomePage } from './pages/HomePage'
import { ShopPage } from './pages/ShopPage'
import { ProductPage } from './pages/ProductPage'
import { ChatPage } from './pages/ChatPage'
import { AddProductPage } from './pages/AddProductPage'
import { FavoritesPage } from './pages/FavoritesPage'
import { CartPage } from './pages/CartPage'
import { VisualisePage } from './pages/VisualisePage'
import { HowItWorksPage } from './pages/HowItWorksPage'
import { CarcassPlannerPage } from './pages/CarcassPlannerPage'
import { CarcassAssemblyPage } from './pages/CarcassAssemblyPage'
import { DesignSpacePage } from './pages/DesignSpacePage'
import { InstallPage } from './pages/InstallPage'
import { ClientPortalPage } from './client-portal/ClientPortalPage'
import { WorkshopLayout } from './workshop/WorkshopLayout'
import { WorkshopDashboard } from './workshop/pages/WorkshopDashboard'
import { WorkshopOrdersPage } from './workshop/pages/WorkshopOrdersPage'
import { WorkshopNewOrderPage } from './workshop/pages/WorkshopNewOrderPage'
import { WorkshopOrderDetailPage } from './workshop/pages/WorkshopOrderDetailPage'
import { WorkshopDepartmentsPage } from './workshop/pages/WorkshopDepartmentsPage'
import { WorkshopPartnersPage } from './workshop/pages/WorkshopPartnersPage'
import { WorkshopDisplayPage } from './workshop/pages/WorkshopDisplayPage'
import { WorkshopModularPage } from './workshop/pages/WorkshopModularPage'
import { WorkshopCutRecordsPage } from './workshop/pages/WorkshopCutRecordsPage'
import { WorkshopProjectsPage } from './workshop/pages/WorkshopProjectsPage'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="workshop" element={<WorkshopLayout />}>
          <Route index element={<WorkshopDashboard />} />
          <Route path="orders" element={<WorkshopOrdersPage />} />
          <Route path="orders/:orderId" element={<WorkshopOrderDetailPage />} />
          <Route path="new-order" element={<WorkshopNewOrderPage />} />
          <Route path="departments" element={<WorkshopDepartmentsPage />} />
          <Route path="modular" element={<WorkshopModularPage />} />
          <Route path="cut-records" element={<WorkshopCutRecordsPage />} />
          <Route path="projects" element={<WorkshopProjectsPage />} />
          <Route path="partners" element={<WorkshopPartnersPage />} />
          <Route path="display" element={<WorkshopDisplayPage />} />
        </Route>

        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="shop/:categoryId" element={<ShopPage />} />
          <Route path="shop/:categoryId/:subcategoryId" element={<ShopPage />} />
          <Route path="product/:productId" element={<ProductPage />} />
          <Route path="design" element={<DesignSpacePage />} />
          <Route path="visualise" element={<VisualisePage />} />
          <Route path="carcass" element={<CarcassPlannerPage />} />
          <Route path="guides/carcass-assembly" element={<CarcassAssemblyPage />} />
          <Route path="how-it-works" element={<HowItWorksPage />} />
          <Route path="install" element={<InstallPage />} />
          <Route path="favorites" element={<FavoritesPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="my-orders" element={<ClientPortalPage />} />
          <Route path="add-product" element={<AddProductPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
