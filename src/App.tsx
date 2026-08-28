import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ScrollToTop } from './components/ScrollToTop'
import { HomePage } from './pages/HomePage'
import { ShopPage } from './pages/ShopPage'
import { ProductPage } from './pages/ProductPage'
import { ChatPage } from './pages/ChatPage'
import { AddProductPage } from './pages/AddProductPage'
import { FavoritesPage } from './pages/FavoritesPage'
import { CartPage } from './pages/CartPage'
import { HowItWorksPage } from './pages/HowItWorksPage'
import { CarcassAssemblyPage } from './pages/CarcassAssemblyPage'
import { AiSubscribePage } from './pages/AiSubscribePage'
import { AiAdminPage } from './pages/AiAdminPage'
import './App.css'

/** Old Design / Visualise / Carcass Planner URLs → unified Chat hub */
function RedirectToChat() {
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  // Preserve product context when deep-linking from old tools
  const next = params.toString() ? `/chat?${params.toString()}` : '/chat'
  return <Navigate to={next} replace />
}

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
          <Route path="design" element={<RedirectToChat />} />
          <Route path="visualise" element={<RedirectToChat />} />
          <Route path="carcass" element={<RedirectToChat />} />
          <Route path="guides/carcass-assembly" element={<CarcassAssemblyPage />} />
          <Route path="how-it-works" element={<HowItWorksPage />} />
          <Route path="install" element={<Navigate to="/" replace />} />
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
