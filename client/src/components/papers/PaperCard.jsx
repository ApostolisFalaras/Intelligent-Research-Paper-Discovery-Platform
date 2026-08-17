import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Unlock, Lock, ExternalLink } from "lucide-react";
import "../../styles/papers.css";

const TOPIC_COLORS = [
    { text: "#2D6A4F", background: "#EDF7F1", border: "#B7DCC7" },
    { text: "#3B5B92", background: "#EEF3FA", border: "#C5D3EA" },
    { text: "#7A5A20", background: "#FAF5E8", border: "#E6D5A8" },
    { text: "#7B4F78", background: "#F8EFF7", border: "#DFC6DC" },
    { text: "#9A4F45", background: "#FBF0EE", border: "#E8C5C0" },
    { text: "#42727A", background: "#EDF7F8", border: "#BEDDE0" },
    { text: "#6B5A8E", background: "#F2EFF8", border: "#D1C7E4" },
    { text: "#5F6F3A", background: "#F2F6E9", border: "#CFDCAE" }
];

function getTopicColor(topic = "") {
    let hash = 0;

    for (let i = 0; i < topic.length; i++) {
        hash = topic.charCodeAt(i) + ((hash << 5) - hash);
    }

    return TOPIC_COLORS[Math.abs(hash) % TOPIC_COLORS.length];
}


function PaperCard({ paper, variant="recommendation" }) {
	const navigate = useNavigate();
	const [expanded, setExpanded] = useState(false);
	
	const authors = paper.authorCount;

	return (
		<div 
			className={`card ${variant}`}
			onClick={() => navigate(`/papers/${paper.id}`)}
		>
			<div className={`card-header ${variant}`}>
				<span 
					className={`paper-topic ${variant}`}
					style={{
						color: getTopicColor(paper.primaryTopic).text,
						backgroundColor: getTopicColor(paper.primaryTopic).background,
						borderColor: getTopicColor(paper.primaryTopic).border
					}}
				>
					{paper.primaryTopic}
				</span>

				<span className={`paper-year ${variant}`}>{paper.publicationYear}</span>
				<span className={`paper-journal ${variant}`}>{paper.primarySource}</span>

				<span className={`paper-access ${variant}`}>
					{paper.isOpenAccess ? (
						<>
							<Unlock size={14} color="#2D6A4F"/>
							<span className="open-access-unlock">Open Access</span>
						</>
					) : (
						<>
							<Lock size={14} color="#9B9B8A" />
							<span className="open-access-lock">Not Open Access</span>
						</>
					)}
					</span>
			</div>
			
			<div className="paper-title-authors">
				<p className={`paper-title ${variant}`}>{paper.title}</p>
				<p className={`authors-preview ${variant}`}>
					{authors > 1 ? (
						<>
							<span>{paper.authorsPreview[0]?.name}, {paper.authorsPreview[1]?.name}{" "}</span>
							<span style={{ color: "#9B9B8A" }}>et al.</span>
						</>
					) : (
						<span>{paper.authorsPreview[0]?.name}</span>
					)}
					
				</p>
			</div>

			{variant === "search" && paper.abstract && (
				<p className={`paper-abstract ${expanded ? "expanded" : ""}`}>
					{paper.abstract}
				</p>
			)}

			<div className={`card-footer ${variant}`}>
				<span className={`citation-count ${variant}`}>{paper.citedByCount} citations</span>
				
				{variant === "search" ? (
					<>
						<button id="expand-abstract-btn"
							onClick={(e) => {
								e.stopPropagation();
								setExpanded((prev) => !prev);
							}}
						>
							{expanded ? "Show less" : "Read abstract"}
						</button>
						
						<button id="view-paper-btn">
							View paper <ExternalLink size={11} />
						</button>
					</>
				) : (
					<ArrowUpRight size={13} className="arrow-up-right" />
				)}
			</div>
		</div>
	);
}

export default PaperCard;