import { useEffect } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'
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
import { KitchMockPage } from './pages/KitchMockPage'
import { FurnicherAiPage } from './pages/FurnicherAiPage'
import { BoxbhandaarLayout } from './pages/BoxbhandaarLayout'
import { BoxbhandaarHomePage } from './pages/BoxbhandaarHomePage'
import { BoxbhandaarProductPage } from './pages/BoxbhandaarProductPage'
import './App.css'

/** Old Design / Visualise / Carcass Planner URLs → unified Chat hub */
function RedirectToChat() {
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  // Preserve product context when deep-linking from old tools
  const next = params.toString() ? `/chat?${params.toString()}` : '/chat'
  return <Navigate to={next} replace />
}

/** Brand domains on this Pages project open the matching segment */
function BrandDomainEntry() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const host = window.location.hostname.toLowerCase()
    if (location.pathname !== '/' && location.pathname !== '') return

    const isKitchMockHost =
      host === 'kitchmock.com' ||
      host === 'www.kitchmock.com' ||
      host === 'kitchmock.in' ||
      host === 'www.kitchmock.in' ||
      host.endsWith('.kitchmock.com') ||
      host.endsWith('.kitchmock.in')
    if (isKitchMockHost) {
      navigate('/kitchmock', { replace: true })
      return
    }

    const isFurnicherHost =
      host === 'furnicherai.com' ||
      host === 'www.furnicherai.com' ||
      host === 'furnicher.ai' ||
      host === 'www.furnicher.ai' ||
      host.endsWith('.furnicherai.com')
    if (isFurnicherHost) {
      navigate('/furnicher-ai', { replace: true })
      return
    }

    const isBoxbhandaarHost =
      host === 'boxbhandaar.com' ||
      host === 'www.boxbhandaar.com' ||
      host === 'boxbhandaar.in' ||
      host === 'www.boxbhandaar.in' ||
      host.endsWith('.boxbhandaar.com') ||
      host.endsWith('.boxbhandaar.in')
    if (isBoxbhandaarHost) {
      navigate('/boxbhandaar', { replace: true })
    }
  }, [location.pathname, navigate])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <BrandDomainEntry />
      <Routes>
        <Route path="boxbhandaar" element={<BoxbhandaarLayout />}>
          <Route index element={<BoxbhandaarHomePage />} />
          <Route path="box/:productId" element={<BoxbhandaarProductPage />} />
        </Route>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="kitchmock" element={<KitchMockPage />} />
          <Route path="furnicher-ai" element={<FurnicherAiPage />} />
          <Route path="furnicherai" element={<Navigate to="/furnicher-ai" replace />} />
          <Route path="shop/kitchen" element={<Navigate to="/shop/kitchmock" replace />} />
          <Route
            path="shop/kitchen/:subcategoryId"
            element={<Navigate to="/shop/kitchmock" replace />}
          />
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
