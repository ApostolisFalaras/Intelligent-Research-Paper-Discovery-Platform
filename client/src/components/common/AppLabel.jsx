import { BookOpen } from "lucide-react";
import "./../../styles/layout.css";

function AppLabel({ iconSize, iconColor, textColor, textSize }) {
	
	return (
		<div className="app-label">
			<BookOpen 
				size={iconSize} 
				color={iconColor}
			/>
			<span 
				className="app-name"
				style={{
					color: textColor,
					fontSize: textSize,
				}}
			>
				Scholaris
			</span>
		</div>
	);
}

export default AppLabel;