import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';
import CookbooksPage from './pages/CookbooksPage';
import AllRecipesPage from './pages/AllRecipesPage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import CookbookDetailPage from './pages/CookbookDetailPage';
import PantryPage from './pages/PantryPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
        <NavBar />
        <Routes>
          <Route path="/" element={<Navigate to="/cookbooks" replace />} />
          <Route path="/cookbooks" element={<CookbooksPage />} />
          <Route path="/cookbooks/:id" element={<CookbookDetailPage />} />
          <Route path="/recipes" element={<AllRecipesPage />} />
          <Route path="/recipes/:id" element={<RecipeDetailPage />} />
          <Route path="/pantry" element={<PantryPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
