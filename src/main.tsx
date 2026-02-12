import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { LocationSelectPage, ClubsListPage, ClubDetailPage, EventDetailPage, PromoterDetailPage } from './pages'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Home page (existing landing page) */}
        <Route path="/" element={<App />} />

        {/* Clubs browsing routes */}
        <Route path="/clubs" element={<LocationSelectPage />} />
        <Route path="/clubs/:city" element={<ClubsListPage />} />
        <Route path="/clubs/:city/:clubId" element={<ClubDetailPage />} />

        {/* Event routes */}
        <Route path="/events/:eventId" element={<EventDetailPage />} />

        {/* Promoter routes */}
        <Route path="/promoters/:promoterId" element={<PromoterDetailPage />} />

        {/* Short link routes */}
        <Route path="/e/:code" element={<EventDetailPage />} />
        <Route path="/c/:code" element={<ClubDetailPage />} />

        {/* Fallback to home */}
        <Route path="*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
