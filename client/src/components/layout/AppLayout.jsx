import { Outlet, useLocation } from "react-router-dom";
import { SideBar } from "./SideBar.jsx";
import { SearchBar } from "./../search/SearchBar.jsx";

function AppLayout() {
    // Using the current URL to check if we're in the home page or not.
    // In the home page, the search bar appears larger, while in other pages, 
    // it appears smaller as papers, profiles, recommendations take up most of the space.
    const location = useLocation();
    const isHomePage = location.pathname === "/";

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-section">
                <SearchBar variant={isHomePage ? "large" : "compact"} />
                <Outlet />
            </main>
        </div>
    );
}

export default AppLayout;