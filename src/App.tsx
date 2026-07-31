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
import { AiSubscribePage } from './pages/AiSubscribePage'
import { AiAdminPage } from './pages/AiAdminPage'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
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
          <Route path="ai" element={<AiSubscribePage />} />
          <Route path="ai-admin" element={<AiAdminPage />} />
          <Route path="favorites" element={<FavoritesPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="add-product" element={<AddProductPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
