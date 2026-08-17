import { NavLink, useLocation } from "react-router-dom";
import AppLabel from "./AppLabel.jsx";
import InitialsAvatar from "./InitialsAvatar.jsx";
import SearchBar from "../search/SearchBar.jsx";
import { useAuth } from "../../hooks/useAuth.jsx"; 
import "./../../styles/common.css";
import { ArrowLeft } from "lucide-react";

const menuItems = [
	{ label: "Search", to:"/search", requiresAuth: false },
	{ label: "Explore", to:"/explore", requiresAuth: false },
	{ label: "My Library", to:"/my-library", requiresAuth: true },
	{ label: "Profile", to:"/my-profile", requiresAuth: true }
];

function NavBar() {
	let { user, authLoading } = useAuth();

	const initials = user
		? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
		: "";

	const location = useLocation();
	const isHomePage = location.pathname === "/";
	const isAuthPage = location.pathname === "/auth";
	const isSearchPage = location.pathname === "/search"; 

	return (
		<div className={`navbar ${isHomePage ? "home": ""}`}>
			
			{/* Left-side app logo */}
			<NavLink to="/" style={{textDecoration: "none"}}>
				<AppLabel 
					iconSize={20} 
					iconColor={isHomePage ? "#B7D8C7" : "#2D6A4F"}
					textColor={isHomePage ? "#FFFFFF" : "#1B4332"}
					textSize="18px"
				/>
			</NavLink>

			{ !isHomePage && !isAuthPage && <div id="app-label-separator" /> }

			{/* Search bar appears in the navbar everywhere except the home page */}
			{ !isHomePage && !isAuthPage && (
				<div id="search-bar-container">
					<SearchBar size={16} variant="navbar" />
				</div>
			)}

			{/* Navbar option-links appear in the navbar everywhere except the login/register page */}
			{ !isAuthPage && (
				<div id="navbar-menu" className={`${isHomePage ? "home" : ""}`}>
					{authLoading ? (
						<div id="navbar-menu-placeholder" />
					) : (
					menuItems
						.filter((option) => !option.requiresAuth || user)
						.map((option) => (
							<NavLink 
								key={option.to} 
								to={option.to}
								className={({ isActive }) => 
									[
										"navbar-menu-option",
										isHomePage ? "home" : "",
										isActive ? !isHomePage ? "active-link" : "" : "" 
									]
									.filter(Boolean)
									.join(" ")
								}
							>
								{option.label}
							</NavLink>
					))
				)}
			</div>
			)}

			{/* "Sign-in" button if user is unauthenticated,
			    Profile avatar with full name initials if the user is logged in, and
				"Back to home" button if user is in the authentication page */}
			{authLoading ?
				<div id="navbar-auth-placeholder" />
				: user ? (
					<InitialsAvatar 
						initials={initials} 
						avatarURL={user?.avatarURL}
						variant={isHomePage ? "light" : "dark"} 
					/>
				) 
				: isAuthPage ? (
					<NavLink to="/" id="back-to-home">
						<ArrowLeft size={14} /> Back to home
					</NavLink>
				)
				: (
				<NavLink to="/auth" id="sign-in-button" className={!isHomePage ? "not-home" : ""}>
					Sign in
				</NavLink>
				)
			}
		</div>
	);
}

export default NavBar;