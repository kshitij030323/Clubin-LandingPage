import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { LocationSelectPage, ExplorePage, ClubsListPage, ClubDetailPage, EventDetailPage, PromoterDetailPage, ListYourClubPage, ScheduleMeetingPage, TermsOfServicePage, PrivacyPolicyPage, DeleteAccountPage, SupportPage } from './pages'
import { ScrollToTop } from './components/ScrollToTop.tsx'
import { AuthProvider } from './lib/auth'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
      <ScrollToTop />
      <Routes>
        {/* Home page (existing landing page) */}
        <Route path="/" element={<App />} />

        {/* Clubs browsing routes */}
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/clubs" element={<LocationSelectPage />} />
        <Route path="/clubs/:city" element={<ClubsListPage />} />
        <Route path="/clubs/:city/:clubId" element={<ClubDetailPage />} />

        {/* Event routes */}
        <Route path="/events/:eventId" element={<EventDetailPage />} />

        {/* List your club */}
        <Route path="/list-your-club" element={<ListYourClubPage />} />
        <Route path="/list-your-club/schedule" element={<ScheduleMeetingPage />} />

        {/* Promoter routes */}
        <Route path="/promoters/:promoterId" element={<PromoterDetailPage />} />

        {/* Support */}
        <Route path="/support" element={<SupportPage />} />

        {/* Legal pages */}
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/delete-account" element={<DeleteAccountPage />} />

        {/* Short link routes */}
        <Route path="/e/:code" element={<EventDetailPage />} />
        <Route path="/c/:code" element={<ClubDetailPage />} />

        {/* Fallback to home */}
        <Route path="*" element={<App />} />
      </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
