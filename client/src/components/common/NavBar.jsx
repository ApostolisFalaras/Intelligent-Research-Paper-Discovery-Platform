import { NavLink } from "react-router-dom";
import AppLabel from "./AppLabel.jsx";
import "./../../styles/layout.css";

const menuItems = [
	{ label: "Search", to:"/search" },
	{ label: "Explore", to:"/explore" },
	{ label: "My Library", to:"/library" },
	{ label: "Profile", to:"/profile" }
];

function NavBar() {
	
	return (
		<div id="navbar">
			<AppLabel 
				iconSize={20} 
				iconColor="#B7D8C7"
				textColor="#FFFFFF"
				textSize="18px"
			/>

			<div id="navbar-menu">
				{menuItems.map((option) => (
					<NavLink key={option.to} to={option.to} className="navbar-menu-option">
						{option.label}
					</NavLink>

				))}
			</div>

			<button id="sign-in-button">
				Sign in
			</button>
		</div>

	);

}

export default NavBar;