import { useState, useEffect, useRef } from "react"; 
import { X, Folder, Check, FolderPlus, Trash2 } from "lucide-react";
import "../../styles/papers.css";



function PaperModal({ paperId, paperInternalId, paperTitle, onClose, onSaved }) {
	const [folders, setFolders] = useState([]);
	
	// Current selections displayed by the modal
	const [selected, setSelected] = useState([]);

	// Original folder memberships when the modal opens
	const [originalSelected, setOriginalSelected] = useState([]);

	const [creating, setCreating] = useState(false);
	const [newName, setNewName] = useState("");

	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);

	const [suppressHover, setSuppressHover] = useState(null);
	const [confirmDelete, setConfirmDelete] = useState(null);

	const backdropRef = useRef(null);

	// Load either:
    // i) every folder owned by the user
    // ii) folders that already contain this paper
	async function loadFolders() {

		try {
			setLoading(true);
			
			const [folderResponse, savedFolderResponse] = await Promise.all([
				fetch("/api/users/me/folders", { 
					credentials: "include"
				}),

				fetch(`/api/papers/${paperId}/folders`, {
					credentials: "include"
				})
			]);

			if (!folderResponse.ok) {
				throw new Error(`Failed to load folders with status ${folderResponse.status}`);
			}

			if (!savedFolderResponse.ok) {
				throw new Error(`Failed to load saved folders with status ${savedFolderResponse.status}`);
			}

			const folderResult = await folderResponse.json();
			const savedFolderResult = await savedFolderResponse.json();

			const allFolders = folderResult?.data?.folders ?? [];
			const savedFolders = savedFolderResult?.data?.folders ?? [];

			const savedFolderIds = savedFolders.map((folder) => folder.id);

			setFolders(allFolders);
			setSelected(savedFolderIds);
			setOriginalSelected(savedFolderIds);

		} catch (error) {
			console.error("Failed to load folder options:", error);
			setFolders([]);
            setSelected([]);
            setOriginalSelected([]);
		}
		finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		if (!paperInternalId) {
			return;
		}

		loadFolders();
	}, [paperInternalId]);


	// Toggle folder storage for a paper
	function handleFolderToggle(folderId) {
		setSelected((prev) => {
			if (prev.includes(folderId)) {
				return prev.filter((id) => id !== folderId);
			}

			return [...prev, folderId];
		})
	}

	// Save paper into selected folder
	    async function handleSave() {
        if (!paperId || !paperInternalId) {
            return;
        }

        // Determine in which folders the paper was added that was not originally stored in,
		// and from which folders the paper removed that was originally stored in
        const foldersToAdd = selected.filter((folderId) => !originalSelected.includes(folderId));
        const foldersToRemove = originalSelected.filter((folderId) => !selected.includes(folderId));

		// Saved status flags
        const wasSaved = originalSelected.length > 0;
        const isSaved = selected.length > 0;

        try {
            setSaving(true);

            // Determine folder-saving requests
            const addRequests = foldersToAdd.map(
                (folderId) => 
					fetch(`/api/users/me/folders/${folderId}/papers/${paperId}`, {
						method: "POST",
						credentials: "include"
					})
            );

            // Determine folder-unsaving requests
            const removeRequests = foldersToRemove.map(
				(folderId) =>
					fetch(`/api/users/me/folders/${folderId}/papers/${paperId}`, {
						method: "DELETE",
						credentials: "include"
					})
			);

			// Perform folder insertion and removal requests
            const membershipResponses = await Promise.all([...addRequests, ...removeRequests]);

			// Checking for any failure among those requests
            const failedResponse = membershipResponses.find((response) => !response.ok);
            if (failedResponse) {
                throw new Error(`Folder update failed with status ${failedResponse.status}`);
    		}

            // Update recommendation/user activity only when the GLOBAL saved state changes.
            // CASE 1: Paper was not saved in any folders and now it is
            if (!wasSaved && isSaved) {
                const activityResponse = await fetch(`/api/papers/${paperInternalId}/save`, {
                        method: "POST",
                        credentials: "include"
                    }
                );

                if (!activityResponse.ok) {
                    console.error(
                        `Folder memberships updated, but save activity failed with status ${activityResponse.status}`
                    );
                }
            }

			// CASE 2: Paper was saved in some folders and now it isn't
            if (wasSaved && !isSaved) {
                const activityResponse = await fetch(`/api/papers/${paperInternalId}/unsave`, {
						method: "POST",
						credentials: "include"
					}
                );

                if (!activityResponse.ok) {
                    console.error(`Folder memberships updated, but unsave activity failed with status ${activityResponse.status}`);
                }
            }

            onSaved?.({ isSaved, folderIds: selected });
            onClose();

        } catch (error) {
            console.error("Failed to update paper folders:", error);

        } finally {
            setSaving(false);
        }
    }

	// Handle new folder creation during paper saving
	async function handleCreateFolder() {
		const name = newName.trim();
		if (!name) {
			return;
		}

		try {
			const response = await fetch("/api/users/me/folders", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				credentials: "include",
				body: JSON.stringify({
					name
				})
			});

			if (!response.ok) {
				throw new Error(`Request failed with status ${response.status}`);
			}

			// New folder creation is now complete
			setNewName("");
			setCreating(false);

			// Reload the new collection of folders
			await loadFolders();

		} catch (error) {
			console.error("Failed to create folder:", error);
		}
	}

	// Handle folder deletion during paper saving
	async function handleDeleteFolder(folderId) {
		try {
			const response = await fetch(`/api/users/me/folders/${folderId}`, {
					method: "DELETE",
					credentials: "include"
				}
			);

			if (!response.ok) {
				throw new Error(
					`Failed to delete collection with status ${response.status}`
				);
			}

			// Folder deletion is immediate, unlike the checkbox
			// membership changes that wait for the Save button.
			setFolders((prev) => prev.filter((folder) => folder.id !== folderId));

			setSelected((prev) => prev.filter((id) => id !== folderId));

			setOriginalSelected((prev) => prev.filter((id) => id !== folderId));

			setConfirmDelete(null);

		} catch (error) {
			console.error("Failed to delete collection:", error);
		}

	}

	const hasChanges = 
		selected?.length !== originalSelected?.length ||
		selected.some((id) => !originalSelected.includes(id));

	return (
		<div
			id="save-modal-backdrop"
            ref={backdropRef}
            onClick={(event) => {
                if (event.target === backdropRef.current) {
                    onClose();
                }
            }}
        >
            <div id="save-modal" onClick={(event) => event.stopPropagation()}>

                {/* Header */}
                <div id="save-modal-header">
                    <div>
                        <p id="save-modal-title">Save to collections</p>
                        <p id="save-modal-paper">{paperTitle}</p>
                    </div>

                    <button type="button" onClick={onClose}>
                        <X size={16} />
                    </button>
                </div>


                {/* Selection information */}
                <div id="save-modal-selection-header">
                    <span>Select one or more collections</span>
					{selected?.length > 0 && (
						<span id="selected-folder-count">{selected?.length} selected</span>
					)}
                </div>


                {/* Folder list */}
                <div id="save-modal-list">
                    {loading ? (
                        <p>Loading collections...</p>
                    ) : (
                        folders.map((folder) => {
                            const active = selected.includes(folder.id);
							const isConfirming = confirmDelete === folder.id;

							const folderColor = folder?.color ?? "#1B4332";

                            return (
                                <div
									key={folder.id}
									className="folder-option-wrapper"
								>
									{isConfirming ? (
										<div className="folder-delete-confirmation">
											<span>Delete "{folder.name}"?</span>

											<button
												type="button"
												className="confirm-folder-delete"
												onClick={() => handleDeleteFolder(folder.id)}
											>
												<span>Delete</span>
											</button>

											<button
												type="button"
												className="cancel-folder-delete"
												onClick={() => {
													setSuppressHover(folder.id);
													setConfirmDelete(null);
												}}
											>
												Cancel
											</button>
										</div>
									) : (
										<div
											className={`folder-option ${active ? "active" : ""}`}
											onMouseLeave={() => {
												if (suppressHover === folder.id) {
													setSuppressHover(null);
												}
											}}
										>
											<button
												type="button"
												className="folder-option-select"
												onClick={() => handleFolderToggle(folder.id)}
											>
												<div
													className={`folder-selection-checkbox ${active ? "active" : ""}`}
												>
													{active && (
														<Check size={13} />
													)}
												</div>

												<div
													className="folder-option-icon"
													style={{
														backgroundColor: `color-mix(in srgb, ${folderColor} 9%, transparent)`,
														border: `1px solid color-mix(in srgb, ${folderColor} 19%, transparent)`
													}}
												>
													<Folder size={13} color={folderColor} />
												</div>

												<div className="folder-option-header">
													<p className="folder-option-name">
														{folder.name}
													</p>

													<p className="folder-option-count">
														{folder.paperCount}{" "}
														{folder.paperCount === 1
															? "paper"
															: "papers"}
													</p>
												</div>
											</button>

											<button
												type="button"
												className={`folder-delete-btn
															${suppressHover === folder.id ? "suppress-hover" : ""}`}
												title="Delete collection"
												onClick={(event) => {
													event.stopPropagation();
													setCreating(false);
													setConfirmDelete(folder.id);
												}}
												onMouseEnter={(event) => {
													event.currentTarget.style.color = "#C0392B";
    											}}
												onMouseLeave={(event) => {
													event.currentTarget.style.color = "#C0C0B4";
												}}
											>
												<Trash2 size={13} />
											</button>
										</div>
									)}
								</div>
                            );
                        })
                    )}
                </div>


                {/* Create new folder */}
                {creating ? (
                    <div id="save-modal-new-folder">
                        <input
                            type="text"
                            value={newName}
                            onChange={(event) => setNewName(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") { handleCreateFolder(); }
                                if (event.key === "Escape") { setCreating(false); setNewName(""); }
                            }}
                            placeholder="Collection name..."
                        />

                        <button
                            type="button"
                            id="save-modal-create-btn"
                            className={newName.trim() ? "valid-name" : ""}
                            disabled={!newName.trim()}
                            onClick={handleCreateFolder}
                        >
                            Create
                        </button>

                        <button
                            type="button"
                            id="save-modal-cancel-btn"
                            onClick={() => { setCreating(false); setNewName(""); }}
                        >
                            <X size={13} />
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        id="save-modal-create-option"
                        onClick={() => setCreating(true)}
                    >
                        <div><FolderPlus size={13} color="#6B6B5A" /></div>
                        <span>New collection...</span>
                    </button>
                )}


                {/* Footer */}
                <div id="save-modal-footer">
                    <span id="save-modal-selected-summary">
                        {selected?.length}{" "}
                        {selected?.length === 1 ? "collection" : "collections"}{" "}
                        selected
                    </span>

                    <div>
                        <button type="button" id="cancel-save-btn" onClick={onClose}>
                            Cancel
                        </button>

                        <button
                            type="button"
                            id="confirm-save-btn"
                            className={hasChanges ? "selected" : ""}
                            onClick={handleSave}
                            disabled={saving || !hasChanges}
                        >
                            {saving ? "Saving..." : "Save"}
                        </button>
                    </div>
                </div>

            </div>
        </div>
	);
}

export default PaperModal;