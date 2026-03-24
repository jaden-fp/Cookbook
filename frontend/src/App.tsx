import { Link } from 'react-router-dom';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';
import BottomNav from './components/BottomNav';
import FAB from './components/FAB';
import { FABProvider } from './context/FABContext';
import CookbooksPage from './pages/CookbooksPage';
import AllRecipesPage from './pages/AllRecipesPage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import CookbookDetailPage from './pages/CookbookDetailPage';
import PantryPage from './pages/PantryPage';

export default function App() {
  return (
    <BrowserRouter>
      <FABProvider>
        <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
          <NavBar />
          {/* Mobile logo — fixed top-right, desktop hidden */}
          <Link to="/cookbooks" className="sm:hidden"
            style={{
              position: 'fixed',
              top: 8,
              right: -8,
              zIndex: 45,
              textDecoration: 'none',
              pointerEvents: 'auto',
            }}
          >
            <img src="/logo.png" alt="Logo" style={{ height: '100px', width: 'auto', objectFit: 'contain' }} />
          </Link>
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
