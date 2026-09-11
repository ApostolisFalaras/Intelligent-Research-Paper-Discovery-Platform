import { useState, useEffect } from "react";
import { BookMarked, ChevronRight, Clock, X } from "lucide-react";
import "../../styles/library.css";
import PaperCard from "../papers/PaperCard.jsx";
import { Link } from "react-router-dom";

function FolderDetails({ folder, onClose }) {
	const [folderPapers, setFolderPapers] = useState([]);
	
	async function loadFolder() {
		try {
			const response = await fetch(`/api/users/me/folders/${folder.id}/papers`, {
				credentials: "include"
			});

			if (!response.ok) {
				throw new Error(`Request failed with status ${response.status}`);
			}

			const result = await response.json();
			console.log(result?.data);
			setFolderPapers(result?.data);

		} catch (error) {
			console.error("Failed to fetch folder data:", error);
			setFolderPapers([]);
		}
	}

	useEffect(() => {
		loadFolder();
	}, []);

	return (
		<div 
			id="folder-panel"
			onClick={onClose}
		>
			<div onClick={(event) => event.stopPropagation()}>

				{/* Panel Header */}
				<div id="folder-panel-header">

					<div id="folder-panel-header-name">
						<div id="folder-panel-name">
							<div style={{backgroundColor: folder?.color ?? "#1B4332"}} />
							<h2>
								{folder?.name}
							</h2>
						</div>
						<button id="close-folder-panel" onClick={onClose}>
							<X size={16} />
						</button>
					</div>
					
					<p id="folder-panel-description">
						{folder?.summary}
					</p>
					
					<div id="folder-panel-info">
						<span>
							<BookMarked size={11} /> {folder?.paperCount} papers
						</span>
						<span>
							<Clock size={11} /> Updated {folder?.updatedAt}
						</span>
					</div>
				</div>

				{/* List of Papers */}
				<div id="folder-papers">
					<p>Papers</p>

					{folderPapers?.length === 0 ? (
						<div id="folder-papers-empty">
							<div>
								<BookMarked size={18} color="#C0C0B4" />
							</div>
							<p>
								This folder is empty.<br />
								<span> 
									Save papers from search to add them here.
								</span>
							</p>
						</div>
					) : (
						<div id="folder-papers-list">
							{folderPapers?.map((paper, index) => (
								<PaperCard key={index} paper={paper} variant="folder" />
							))}
						</div>
					)}
				</div>

				{/* Footer Section */}
				<div id="folder-panel-footer">
					<Link id="add-new-papers" to="/search">
						Add Papers <ChevronRight size={13} />
					</Link>
				</div>
			</div>
		</div>

	);
}

export default FolderDetails;