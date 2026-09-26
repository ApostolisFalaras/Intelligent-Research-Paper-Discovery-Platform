import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import AppLayout from "./components/layout/AppLayout.jsx";
import { ExploreProvider } from "./context/ExploreProvider.jsx";

const HomePage = lazy(() => import("./HomePage.jsx"));
const AuthPage = lazy(() => import("./AuthPage.jsx"));
const SearchPage = lazy(() => import("./SearchPage.jsx"));
const PaperPage = lazy(() => import("./PaperPage.jsx"));
const ExplorePage = lazy(() => import("./ExplorePage.jsx"));
const ExploreTopicPage = lazy(() => import("./ExploreTopicPage.jsx"));
const LibraryPage = lazy(() => import("./LibraryPage.jsx"));
const ProfilePage = lazy(() => import("./ProfilePage.jsx"));
const AccountSettingsPage = lazy(() => import("./AccountSettingsPage.jsx"));
const RecommendationsPage = lazy(() => import("./RecommendationsPage.jsx"));
const AuthorPage = lazy(() => import("./AuthorPage.jsx"));


function App() {
  
  return (
    <BrowserRouter>
      <ExploreProvider>
        <Suspense fallback={<div>Loading...</div>}>
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
        </Suspense>
      </ExploreProvider>

      <Toaster 
        position="bottom-right"
        richColors
        closeButton
      />
    </BrowserRouter>
  );
}

export default App;
