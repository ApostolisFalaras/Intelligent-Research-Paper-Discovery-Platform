import { useState, useEffect } from "react";
import { useAuth } from "./hooks/useAuth.jsx";
import FolderCard from "./components/library/FolderCard.jsx";
import NewFolderModal from "./components/library/NewFolderModal.jsx";
import FolderDetails from "./components/library/FolderDetails.jsx";
import { Plus, Search } from "lucide-react";
import "./styles/library.css";



function LibraryPage() {
    const { user, authLoading } = useAuth();

    const [showModal, setShowModal] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState(null);

    const [folders, setFolders] = useState([]);
    const [filterQuery, setFilterQuery] = useState("");

    const totalPapers = folders?.reduce((acc, curr) => acc + curr?.paperCount, 0);

    // Filter folders based on filter query
    const filteredFolders = folders.filter((folder) => (
        folder.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
        folder.summary.toLowerCase().includes(filterQuery.toLowerCase())
    ));

    async function loadFolders() {
        try {
            const response = await fetch("/api/users/me/folders", {
                credentials: "include"
            });

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }
            
            const results = await response.json();
            
            setFolders(results?.data.folders ?? []);
            console.log(results.data);

        } catch (error) {
            console.error("Failed to fetch profile info:", error);
            setFolders([]);
        }
    }


    useEffect(() => {
        loadFolders();
    }, []);

    
    if (authLoading) {
        return <div>Loading profile...</div>;
    }

    if (!user) {
        return null;
    }


    return (
        <div id="library-page">

            {/* Header */}
            <div id="library-header">
                <div>
                    <div id="header-info">
                        <div>
                            <p id="library-user">
                                {user?.firstName}{" "}{user?.lastName} • @{user?.firstName}_{user?.lastName}
                            </p>
                            <h1 id="library-title">My Library</h1>
                            <p id="library-totals">
                                {folders?.length ?? 0} collections •{" "}
                                {totalPapers ?? 0} papers
                            </p>
                        </div>

                        <button
                            id="add-folder"
                            onClick={() => setShowModal(true)}
                        >
                            <Plus size={14} /> New Folder
                        </button>
                    </div>

                    {/* Search filter */}
                    <div id="search-filter">
                        <Search size={13} color="#9B9B8A" />
                        <input 
                            type="text"
                            value={filterQuery}
                            placeholder="Filter folders..."
                            id="search-folder-input"
                            onChange={(event) => setFilterQuery(event.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Main Folders Grid */}
            <main id="folders-section">
                {filteredFolders.length === 0 ? (
                    <div id="no-available-folders">
                        No collections match "{filterQuery}"
                    </div>
                ) : (
                    <div id="folders-grid">
                        {filteredFolders.map((folder) => (
                            <FolderCard key={folder.id} folder={folder} onClick={() => setSelectedFolder(folder)}/>
                        ))}
                    </div>
                )}
            </main>    

            {/* Modals */}
            {showModal && <NewFolderModal onClose={() => setShowModal(false)} />}
            {selectedFolder && <FolderDetails folder={selectedFolder} onClose={() => setSelectedFolder(null)}/>}

        </div>
    );
}

export default LibraryPage;