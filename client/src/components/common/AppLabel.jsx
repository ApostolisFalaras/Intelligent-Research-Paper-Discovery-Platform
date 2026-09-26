import { BookOpen } from "lucide-react";
import "./../../styles/common.css";

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
				Mr. Scholar
			</span>
		</div>
	);
}

export default AppLabel;