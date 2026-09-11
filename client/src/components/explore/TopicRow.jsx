import { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import "./../../styles/explore.css";
import PaperCard from "../papers/PaperCard.jsx";


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


function TopicRow({ topicPreview }) {
	const scrollRef = useRef(null);

	function scroll(direction) {
		scrollRef.current.scrollBy({ 
			left: direction === "left" ? -500 : 500,
			behavior: "smooth"
		});
	}

	const topicColor = getTopicColor(topicPreview?.topic?.displayName).text ?? "#1B4332";

	return (
		<section>
			{/* Row Header */}
			<div className="topic-row-header">
				<div>
					<span
						className="topic-row-square" 
						style={{
							backgroundColor: topicColor
						}}/>
					<span className="topic-row-name">{topicPreview?.topic?.displayName}</span>
					<span className="topic-row-field">{topicPreview?.topic?.fieldDisplayName}</span>
				</div>

				<Link 
					to={`/explore/topic/${topicPreview?.topic?.id}`}
					className="see-all-btn"
				>
					See all <ChevronRight size={13} />
				</Link>
			</div>

			{/* Scroll container */}
			<div style={{ position: "relative" }}>
				<div 
					ref={scrollRef}
					className="scroll-container"
				>
					{topicPreview?.papers?.map((paper) => (
						<div style={{maxWidth: "300px" }}>
							<PaperCard 
								key={paper.id} 
								paper={paper} 
							/>
						</div>
					))}

					<Link
						to={`/explore/topic/${topicPreview?.topic?.id}`}
						className="see-all-entry"
						style={{
							background: `${topicColor}0D`, 
							border: `1px dashed ${topicColor}50`,
						}}
						onMouseEnter={(e) => (e.currentTarget.style.background = `${topicColor}1A`)}
						onMouseLeave={(e) => (e.currentTarget.style.background = `${topicColor}0D`)}
					>
						<ArrowRight size={18} color={topicColor} />
						<span 
							className="see-all-msg"
							style={{ color: topicColor }}
						>
							See all
						</span>
					</Link>
				</div>
				
				{/* Scroll Buttons */}
				{["left", "right"].map(((dir) => (
					<button
						key={dir}
						className={`dir-btn ${dir}`}
						onClick={() => scroll(dir)}
					>
						{dir === "left"
							? <ChevronLeft size={12} />
							: <ChevronRight size={12} />
						}
					</button>
				)))}
			</div>
		</section>
	);
}

export default TopicRow;