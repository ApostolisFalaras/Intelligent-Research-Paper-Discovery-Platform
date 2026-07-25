import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../hooks/useAuth.jsx";
import "../../styles/common.css";



function InitialsAvatar({ initials, variant }) {
	const [isOpen, setIsOpen] = useState(false);
	const { logout } = useAuth();
	const navigate = useNavigate();

	const containerRef = useRef(null);

	/* Upon mounting, attach an event listener that closes the avatar's dropdown
	 whenever it's open and the user interacts with something other than it. */
	useEffect(() => {
		function handleClickOutside(event) {
			if (containerRef.current && !containerRef.current.contains(event.target)) {
				setIsOpen(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		}
	}, []);

	async function handleLogout() {
		setIsOpen(false);

		try {
			await logout();
			
			toast.success("You have successfully logged out.");
			navigate("/");
		} catch (error) {
			toast.error("Failed to log out.");
		}
	}

	return (
	<div ref={containerRef} id={`profile-avatar ${variant ?? ""}`}>
		<button 
			type="button"
			className={`${variant ?? ""} ${isOpen ? "open" : ""}`}
			id="avatar-button"
			onClick={() => setIsOpen((prev) => !prev)}
		>
			<span id="avatar-text">{initials}</span>
		</button>

		{isOpen && (
			<div id="dropdown">
				<NavLink 
					to="/account-settings" 
					className="dropdown-option first"
					onClick={() => {
						setIsOpen(false);
						navigate("/account-settings");
					}}
				>
					Account settings
				</NavLink>

				<NavLink
					to="/"
					className="dropdown-option second"
					onClick={handleLogout}
				>
					Log out
				</NavLink>
			</div>
		)}
	</div>
	);
}

export default InitialsAvatar;