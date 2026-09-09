import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import AppLayout from "./components/layout/AppLayout.jsx";
import HomePage from "./HomePage.jsx";
import AuthPage from "./AuthPage.jsx";
import SearchPage from "./SearchPage.jsx";
import PaperPage from "./PaperPage.jsx";
import ExplorePage from "./ExplorePage.jsx";
import ExploreTopicPage from "./ExploreTopicPage.jsx";
import LibraryPage from "./LibraryPage.jsx";
import ProfilePage from "./ProfilePage.jsx";
import AccountSettingsPage from "./AccountSettingsPage.jsx";
import RecommendationsPage from "./RecommendationsPage.jsx";
import AuthorPage from "./AuthorPage.jsx";

function App() {
  
  return (
    <BrowserRouter>
      <Routes>
        {/* AppLayout is the base layout of all pages */}
        <Route element={<AppLayout />} >
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/papers/:id" element={<PaperPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/explore/topic/:id" element={<ExploreTopicPage />} />
          <Route path="/my-library" element={<LibraryPage />} />
          <Route path="/my-profile" element={<ProfilePage />} />
          <Route path="/account-settings" element={<AccountSettingsPage />} />
          <Route path="/recommendations" element={<RecommendationsPage />} />
          <Route path="/authors/:id" element={<AuthorPage />} />
        </Route>
      </Routes>

      <Toaster 
        position="bottom-right"
        richColors
        closeButton
      />
    </BrowserRouter>
  );
}

export default App;
