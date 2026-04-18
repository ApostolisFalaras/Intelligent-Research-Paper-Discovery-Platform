import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout.jsx";
import { HomePage } from "./pages/HomePage.jsx";
import { SearchPage } from "./pages/SearchPage.jsx";
import { PaperPage } from "./pages/PaperPage.jsx";
import { AuthorPage } from "./pages/AuthorPage.jsx";
import { ProfilePage } from "./pages/ProfilePage.jsx";
import { ProjectsPage } from "./pages/ProjectsPage.jsx";
import { RecommendationsPage } from "./pages/RecommendationsPage.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* AppLayout is the base layout of all pages */}
        <Route element={<AppLayout />} >
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/paper/:id" element={<PaperPage />} />
          <Route path="/authors/:id" element={<AuthorPage />} />
          <Route path="/me/profile" element={<ProfilePage />} />
          <Route path="/me/folders" element={<ProjectsPage />} />
          <Route path="/recommendations" element={< RecommendationsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
