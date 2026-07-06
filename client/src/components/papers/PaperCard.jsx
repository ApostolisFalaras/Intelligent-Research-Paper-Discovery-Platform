import { ArrowUpRight } from "lucide-react";
import "../../styles/papers.css";

function PaperCard({ paper }) {

	return (
		<div className="card">
			<div className="card-header">
				<span className="paper-topic">{paper.primaryTopic}</span>
				<span className="paper-year">{paper.publicationYear}</span>
				<span className="paper-journal">{paper.primarySource}</span>
			</div>

			<p className="paper-title">{paper.title}</p>
			<p className="authors-preview">
				{paper.authorPreview[0].authorDisplayName}, {paper.authorPreview[1].authorDisplayName}{" "}
				<span style={{ color: "#9B9B8A" }}>et al.</span>
			</p>

			<div className="card-footer">
				<span className="citation-count">{paper.citedByCount} citations</span>
				<ArrowUpRight size={13} className="arrow-up-right" />
			</div>
		</div>
	);
}

export default PaperCard;