import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import PaperCard from "../papers/PaperCard.jsx";
import "./../../styles/home.css";


function RecommendationsRow({ type, label, sublabel, icon, papers }) {
	return (
		<section className="recom-section">

			<div className="section-header">
				<div className="section-type">
					<span className="section-icon">{icon}</span>
					<h2 className="section-label">{label}</h2>
					<span className="section-sublabel">{sublabel}</span>
				</div>

				<Link to={`/recommendations?type=${type}`} className="see-all-btn">
					See all <ChevronRight size={14} />
				</Link>
			</div>

			<div className="paper-card-row">
				{papers.map((paper) => (
					<PaperCard key={paper.id} paper={paper} />
				))}
			</div>

		</section>
	);
}

export default RecommendationsRow;