import { Search } from "lucide-react";
import "./../../styles/home.css";

function Hero() {
	return (
		<div id="hero">

			<div id="hero-content">
				<p id="hero-app-name">
					RESEARCH INTELLIGENCE PLATFORM
				</p>
				<h1 id="hero-title">
					Discover the science that <br />
					<em style={{fontStyle: "italic", color: "#B7E4C7"}}>shapes tomorrow</em>
				</h1>
				<p id="hero-msg">
					Semantic search across 1M scholarly papers, article, and preprints. <br />
					Personalized to your research interests and reading history. 
				</p>

				<div id="hero-search">
					<div className="search-bar">
						<Search size={18} className="search-icon" />

						<input 
							type="text"
							placeholder="Search papers, authors, topics..."
							className="search-input"	
						/>

						<button className="search-button">Search</button>
					</div>
				</div>
			</div>


			<div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "64px", background: "linear-gradient(to bottom, transparent, #F8F9FA)", pointerEvents: "none" }} />
			
		</div>
	);
}

export default Hero;