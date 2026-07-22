import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { ShopPage } from './pages/ShopPage'
import { ProductPage } from './pages/ProductPage'
import { ChatPage } from './pages/ChatPage'
import { AddProductPage } from './pages/AddProductPage'
import { FavoritesPage } from './pages/FavoritesPage'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="shop/:categoryId" element={<ShopPage />} />
          <Route path="shop/:categoryId/:subcategoryId" element={<ShopPage />} />
          <Route path="product/:productId" element={<ProductPage />} />
          <Route path="favorites" element={<FavoritesPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="add-product" element={<AddProductPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
