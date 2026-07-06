import { BookOpen } from "lucide-react";
import AppLabel from "./AppLabel.jsx";
import "./../../styles/layout.css";

function Footer() {

	return (
		<footer id="footer">
			<AppLabel 
				iconSize={18} 
				iconColor="#74C69D"
				textColor="rgba(255,255,255,0.8)"
				textSize="16px"
			/>
			<p id="footer-copyright">© Scholaris Research Intelligence · Built for the curious</p>
		</footer>

	);
}

export default Footer;