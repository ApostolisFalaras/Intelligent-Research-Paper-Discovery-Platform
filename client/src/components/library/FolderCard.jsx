import { FolderOpen, MoreHorizontal, BookMarked, Clock, ArrowRight } from "lucide-react";
import PaperCard from "./../papers/PaperCard.jsx";
import "../../styles/library.css";


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


function FolderCard({ folder, onClick }) {

	return (
		<div 
			className="folder-card"
			onClick={onClick}
		>

			{/* Upper-border color band */}
			<div className="color-band" style={{ backgroundColor: folder?.color ?? "#1B4332" }}/>

			<div className="folder-card-container">
				{/* Header */}
				<div className="folder-card-header">
					<div>
						<FolderOpen size={14} color={folder?.color ?? "#1B4332"} />
						<h3 className="folder-card-name">
							{folder?.name ?? "-"}
						</h3>
					</div>

					<button
						onClick={() => e.stopPropagation()} 
						className="folder-card-more"
					>
						<MoreHorizontal size={14} />
					</button>
				</div>

				{/* Description */}
				<p className="folder-card-description">
					{folder?.summary ?? "-"}
				</p>

				{/* Paper Previews */}
				<div className="folder-card-previews">
					{folder?.papersPreview?.length === 0 ? (
						<div className="empty-folder-preview">
							<span>No papers yet</span>
						</div>
					) : (
						<>
							{folder?.papersPreview?.map((paper, index) => (
								<div key={index} className="paper-preview">
									<span 
										className="paper-preview-topic"
										style={{
											color: getTopicColor(paper.primaryTopic).text,
											backgroundColor: getTopicColor(paper.primaryTopic).background,
											borderColor: getTopicColor(paper.primaryTopic).border
										}}>
											{paper.primaryTopic}
									</span>
									<span className="paper-preview-title">{paper.title}</span>
								</div>
							))}

							{folder?.papersPreview?.length > 2 && (
								<span className="paper-preview-remaining">
									+{folder?.paperCount - 2} more
								</span>
							)}
						</>
					)}
				</div>

				{/* Footer */}
				<div className="folder-card-footer">
					<div>
						<span className="folder-card-footer-info">
							<BookMarked size={11} /> {folder?.paperCount ?? 0}
						</span>
						<span className="folder-card-footer-info">
							<Clock size={11} /> {folder?.updatedAt ?? "-"}
						</span>
					</div>
					<ArrowRight size={13} className="folder-card-expand" />
				</div>

			</div>

		</div>
	);
}

export default FolderCard;