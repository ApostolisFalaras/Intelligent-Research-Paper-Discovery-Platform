import { ChevronRight } from "lucide-react";
import PaperCard from "../papers/PaperCard.jsx";
import "./../../styles/home.css";


function RecommendationsRow({ label, sublabel, icon, papers }) {
	return (
		<section className="recom-section">

			<div className="section-header">
				<div className="section-type">
					<span className="section-icon">{icon}</span>
					<h2 className="section-label">{label}</h2>
					<span className="section-sublabel">{sublabel}</span>
				</div>

				<button className="see-all-btn">
					See all <ChevronRight size={14} />
				</button>
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