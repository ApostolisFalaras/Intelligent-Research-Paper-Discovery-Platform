import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import "../../styles/account-settings.css";


function DeleteModal({ onClose, onDelete, profileInfo }) {
	const [confirm, setConfirm] = useState("");
	const matches = confirm === "delete my account";

	
	return (
		<div id="delete-modal">
			<div onClick={(event) => event.stopPropagation()}>
				
				<div id="delete-modal-header">
					<div>
						<AlertTriangle size={16} color="#C0392B" />
					</div>
					<h2>Delete account</h2>
				</div>

				<p id="delete-modal-paragraph">
					This will permanently delete your account, all saved papers, and collections.
					<strong style={{ color: "#212529" }}>This cannot be undone.</strong>
				</p>

				<div id="delete-modal-totals">
					<p>
						{profileInfo?.totalSavedPapers ?? ""} saved papers •{" "}
						{profileInfo?.totalFolders ?? ""} collections •{" "} 
						{profileInfo?.authorsFollowed?.length ?? ""} followed authors will be deleted.
					</p>
				</div>

				<div id="delete-modal-confirm-text">
					<label>
						Type{" "}
						<strong style={{ color: "#212529", fontFamily: "'JetBrains Mono', monospace" }}>
							delete my account
						</strong> 
						{" "}to confirm
					</label>

					<input 
						type="text"
						placeholder="delete my account"
						id="confirm-input"
						className={confirm ? "matches" : ""}
						onChange={(event) => setConfirm(event.target.value)}
					/>
				</div>

				<div id="delete-modal-buttons">
					<button className="close" onClick={onClose}>
						Cancel
					</button>
					<button className={`delete ${matches ? "matches" : ""}`} onClick={onDelete} disabled={!matches}>
						Delete account
					</button>
				</div>
			</div>
		</div>
	);
}

export default DeleteModal;