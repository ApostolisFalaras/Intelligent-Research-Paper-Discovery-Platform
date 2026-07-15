import SearchBar from "../search/SearchBar.jsx";
import FloatingPapers from "./FloatingPapers.jsx";
import "./../../styles/home.css";

function Hero() {
	return (
		<div id="hero">
			<FloatingPapers />
			
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

				<SearchBar variant="hero" />
			</div>


			<div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "64px", background: "linear-gradient(to bottom, transparent, #F8F9FA)", pointerEvents: "none" }} />
			
		</div>
	);
}

export default Hero;