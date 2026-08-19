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
import './App.css'

function ChatRedirect() {
  const location = useLocation()
  return <Navigate to={`/chat${location.search}`} replace />
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
          <Route path="design" element={<ChatRedirect />} />
          <Route path="visualise" element={<ChatRedirect />} />
          <Route path="carcass" element={<ChatRedirect />} />
          <Route path="guides/carcass-assembly" element={<ChatRedirect />} />
          <Route path="how-it-works" element={<HowItWorksPage />} />
          <Route path="install" element={<Navigate to="/" replace />} />
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
