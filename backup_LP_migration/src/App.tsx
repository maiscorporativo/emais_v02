import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import PartnersMarquee from './components/PartnersMarquee';
import TrendingPackages from './components/TrendingPackages';
import PlatinumAccess from './components/PlatinumAccess';
import ContactForm from './components/ContactForm';

import Footer from './components/Footer';
import BackToTop from './components/BackToTop';
import ImageAdmin from './admin/ImageAdmin';
import MasterAdmin from './admin/MasterAdmin';
import CategoriesSection from './components/CategoriesSection';
import NotFound from './components/NotFound';
import { SelectedPackageProvider } from './hooks/useSelectedPackage';

const PAGE_TITLES: Record<string, string> = {
  '/':            'E-Mais — Experiências Premium em Eventos Esportivos',
  '/admin':       'E-Mais Admin',
  '/admin-master':'E-Mais Master Admin',
};

function usePageTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = PAGE_TITLES[pathname] ?? 'E-Mais';
  }, [pathname]);
}

function SitePage() {
  usePageTitle();
  return (
    <SelectedPackageProvider>
      <div className="min-h-screen bg-primary-main text-white selection:bg-gold selection:text-white pb-0">
        <div className="fixed top-0 left-0 right-0 z-50">
          <Navbar />
        </div>
        <div className="h-[110px]" />
        <HeroSection />
        <PartnersMarquee />
        <TrendingPackages />
        <CategoriesSection />
        <ContactForm />
        <PlatinumAccess />

        <Footer />
        <BackToTop />
      </div>
    </SelectedPackageProvider>
  );
}

function AdminPage() { usePageTitle(); return <ImageAdmin />; }
function MasterPage() { usePageTitle(); return <MasterAdmin />; }

function App() {
  return (
    <Routes>
      <Route path="/"            element={<SitePage />} />
      <Route path="/admin"       element={<AdminPage />} />
      <Route path="/admin-master"element={<MasterPage />} />
      <Route path="*"            element={<NotFound />} />
    </Routes>
  );
}

export default App;
