import { Outlet, useLocation } from "react-router-dom";
import NavBar from "../common/NavBar.jsx";
import Footer from "../common/Footer.jsx";
import PaperCard from "../papers/PaperCard.jsx";

function AppLayout() {
    
    return (
        <>
            <NavBar />

            <Outlet />
            
            <Footer />
        </>
    );
}

export default AppLayout;