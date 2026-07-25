import { BookOpen } from "lucide-react";
import { useLocation } from "react-router-dom";
import AppLabel from "./AppLabel.jsx";
import "./../../styles/common.css";

function Footer() {
	const location = useLocation();
	const isHomePage = location.pathname === "/";
	const isExplorePage = location.pathname === "/explore";

	return (
		(isHomePage || isExplorePage) && (
			<footer id="footer">
				<AppLabel 
					iconSize={18} 
					iconColor="#74C69D"
					textColor="rgba(255,255,255,0.8)"
					textSize="16px"
				/>
				<p id="footer-copyright">© Scholaris Research Intelligence · Built for the curious</p>
			</footer>
		)
	);
}

export default Footer;