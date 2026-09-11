import { useState } from "react";
import { X } from "lucide-react";
import "../../styles/library.css";

const COLOR_PALETTE = [
	"#2D6A4F", "#3B5B92", "#7A5A20", "#7B4F78",
    "#9A4F45", "#42727A", "#6B5A8E", "#5F6F3A"
];

function NewFolderModal({ onClose, onCreate }) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [color, setColor] = useState("#2D6A4F");
	const [nameFocused, setNameFocused] = useState(false);
	const [descFocused, setDescFocused] = useState(false);


	return (
		<div 
			id="new-folder-modal" 
			onClick={onClose}
		>
			<div onClick={(event) => event.stopPropagation()}>

				{/* Modal Header */}
				<div id="modal-header">
					<h2>New Collection</h2>
					<button onClick={onClose}>
						<X size={16} />
					</button>
				</div>

				{/* Folder Features */}
				<div id="folder-features">
					<div id="insert-folder-name">
						<label>
							Name <span style={{color: "#2D6A4F"}}>*</span>
						</label>
						<input 
							value={name}
							onChange={(event) => setName(event.target.value)}
							onFocus={() => setNameFocused(true)}
							onBlur={() => setNameFocused(false)}
							placeholder="e.g., Computer Science"
							className={nameFocused ? "name-focused" : ""}
						/>
					</div>

					<div id="insert-description">
						<label>Description</label>
						<textarea 
							value={description}
							onChange={(event) => setDescription(event.target.value)}
							onFocus={() => setDescFocused(true)}
							onBlur={() => setDescFocused(false)}
							placeholder="What papers will you collect here?"
							className={descFocused ? "desc-focused" : ""}
						/>
					</div>

					<div id="select-folder-color">
						<label>Color</label>
						<div>
							{COLOR_PALETTE.map((paletteColor) => (
								<button 
									key={paletteColor}
									onClick={() => setColor(paletteColor)}
									className="folder-color-option"
									style={{ 
										backgroundColor: paletteColor, 
										borderColor: paletteColor === color ? "#212529" : "transparent", 
										boxShadow: paletteColor === color ? "0 0 0 2px #FFFFFF inset": "none"
									}}
								/>
							))}
						</div>
					</div>

					
				</div>

				<div id="modal-buttons">
					<button
						id="cancel-new-folder"
						onClick={onClose}
					>
						Cancel
					</button>

					<button
						id="create-new-folder"
						disabled={!name.trim()}
						className={!name.trim() ? "invalid-name" : ""}
						onClick={() => {
							if (name.trim()) {
								onCreate(name, description, color);
								onClose();
							}
						}}
					>
						Create folder
					</button>
				</div>
			</div>
		</div>
	);
}

export default NewFolderModal;