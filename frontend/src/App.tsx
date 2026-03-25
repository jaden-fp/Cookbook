import { Link, useLocation } from 'react-router-dom';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';
import BottomNav from './components/BottomNav';
import { FABProvider } from './context/FABContext';
import FAB from './components/FAB';
import CookbooksPage from './pages/CookbooksPage';
import AllRecipesPage from './pages/AllRecipesPage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import CookbookDetailPage from './pages/CookbookDetailPage';
import PantryPage from './pages/PantryPage';

function MobileLogo() {
  const { pathname } = useLocation();
  if (/^\/recipes\/[^/]+/.test(pathname)) return null;
  return (
    <Link to="/cookbooks" className="sm:hidden"
      style={{
        position: 'absolute',
        top: 8,
        right: -8,
        zIndex: 45,
        textDecoration: 'none',
        pointerEvents: 'auto',
      }}
    >
      <img src="/logo.png" alt="Logo" style={{ height: '100px', width: 'auto', objectFit: 'contain' }} />
    </Link>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <FABProvider>
        <div className="min-h-screen" style={{ background: 'var(--bg)', position: 'relative' }}>
          <NavBar />
          {/* Mobile logo — scrolls with page, hidden on recipe detail, desktop hidden */}
          <MobileLogo />
          <Routes>
            <Route path="/" element={<Navigate to="/cookbooks" replace />} />
            <Route path="/cookbooks" element={<CookbooksPage />} />
            <Route path="/cookbooks/:id" element={<CookbookDetailPage />} />
            <Route path="/recipes" element={<AllRecipesPage />} />
            <Route path="/recipes/:id" element={<RecipeDetailPage />} />
            <Route path="/pantry" element={<PantryPage />} />
          </Routes>
          <FAB />
          <BottomNav />
        </div>
      </FABProvider>
    </BrowserRouter>
  );
}
