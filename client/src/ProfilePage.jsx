import { useState, useEffect } from "react";
import { Link } from "react-router-dom"; 
import { useAuth } from "./hooks/useAuth.jsx";
import { Building2, MapPin, Edit3, BookMarked, 
         BookOpen, Users, ChevronRight, Eye } from "lucide-react";
import PaperCard from "./components/papers/PaperCard.jsx";
import "../src/styles/profile.css";
import FollowingAuthors from "./components/authors/FollowingAuthors.jsx";



function ProfilePage() {
    const { user, authLoading } = useAuth();
    
    const [activeTab, setActiveTab] = useState("recent activity");
    const [profileInfo, setProfileInfo] = useState(null);

    // Don't load user profile statistics until user is authenticated
    useEffect(() => {
        if (authLoading || !user) {
            return;
        }

        // Fetches profile info: activity totals, recent activity, top folders, recent followed authors
        async function fetchProfileInfo() {
            try {

                const response = await fetch("/api/users/me/profile", {
                    credentials: "include",
                    cache: "no-store",
                });

                if (!response.ok) {
                    throw new Error(`Request failed with status ${response.status}`);
                }

                const result = await response.json();
                setProfileInfo(result.data ?? null);
            }
            catch (error) {
                console.error("Failed to fetch profile info:", error);
                setProfileInfo(null);
            }
        }

        fetchProfileInfo();

    }, [authLoading, user?.userId]);
    
    if (authLoading) {
        return <div>Loading profile...</div>;
    }

    if (!user) {
        return null;
    }

    const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();

    const userStats = [
        { label: "Viewed papers", value: profileInfo?.totalViewedPapers ?? "", icon: <Eye size={15}/> },
        { label: "Saved papers", value: profileInfo?.totalSavedPapers ?? "", icon: <BookMarked size={15} /> },
        { label: "Collections", value: profileInfo?.totalFolders ?? "", icon: <BookOpen size={15} /> },
        { label: "Following", value: profileInfo?.authorsFollowed?.length ?? "", icon: <Users size={15} /> },
    ];

    return (
        <div id="profile-page">

            {/* Profile Header */}
            <main id="profile-header">
                <div>
                    <div>

                        {/* User Profile Avatar */}
                        {(user?.avatarURL !== null)
                            ? <img src={user?.avatarURL} alt="Profile" id="profile-avatar-image"/>
                            :(
                                <div id="large-initials-avatar">
                                    <span>{initials}</span>
                                </div>
                            )
                        }
                        
                        {/* User Info */}
                        <div id="user-info">
                            <div>
                                <div>
                                    <h1 id="user-name">{user?.firstName}{" "}{user?.lastName}</h1>

                                    <p id="user-at">@{user?.firstName}_{user?.lastName}</p>

                                    <div>
                                        <span id="user-affiliation">
                                            <Building2 size={16}/>
                                            {(user?.affiliation && user?.affiliation !== "None") ? user?.affiliation : "-"}
                                        </span>
                                        <span id="user-location">
                                            <MapPin size={16} />
                                            {(user?.location && user?.location !== "None") ? user?.location : "-"}
                                        </span>
                                        <span id="user-role">
                                            {(user?.role && user?.role !== "None") ? user?.role : "-"}
                                        </span>
                                    </div>
                                </div>

                                <a href="/account-settings" id="account-settings-btn">
                                    <Edit3 size={16} /> Edit Profile
                                </a>  
                            </div>
                            <p id="user-bio">
                                {(user?.bio && user?.bio !== "None") ? user?.bio : "-"}
                            </p>
                        </div>
                        
                        
                    </div>

                    {/* Stats Strip */}
                    <div id="user-stats-strip">
                        {userStats.map((stat, i) => (
                            <div key={stat.label} className={`user-stat ${(i == userStats.length-1) ? "last": ""}`}>
                                <span>{stat.icon}</span>
                                <div>
                                    <div className="stat-value">{stat.value}</div>
                                    <div className="stat-label">{stat.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Tabs */}
                    <div id="tabs">
                        {["recent activity", "saved papers", "about"].map((tab) => (
                            <button 
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`tab-btn ${tab === activeTab ? "active" : ""}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    
                </div>
            </main>

            {/* Profile Tabs Content */}
            <div id="tabs-content">

                {/* Main Column */}
                <div id="main-column">
                    
                    {activeTab === "recent activity" && (
                        <div id="recent-activity-tab">
                            <h2>Recently Viewed</h2>
                            <div>
                                {profileInfo?.previewViewedPapers?.map((paper) => (
                                    <PaperCard key={paper.id} paper={paper} variant="profile" />
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === "saved papers" && (
                        <div id="saved-papers-tab">
                            <h2>Saved Papers</h2>
                            <div>
                                {profileInfo?.previewSavedPapers?.map((paper) => (
                                    <PaperCard key={paper.id} paper={paper} variant="profile" />
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === "about" && (
                        <div id="about-tab">
                            <h3>Research interests</h3>

                            <div id="topic-pills">
                                {profileInfo?.researchTopics?.map((topic) => (
                                    <span
                                        key={topic.id}
                                        className="profile-topic-pill"
                                    >
                                        {topic.name}
                                    </span>
                                ))}
                            </div>

                            <div>
                                <h3 id="affiliation-title">Affiliation</h3>
                                <p id="affiliation-description">{user?.affiliation}</p>
                            </div>
                        </div>
                    )}
                </div>

                <aside id="tabs-sidebar">

                    <div id="library-shortcut">
                        <div id="library-shortcut-header">
                            <span>My Library</span>
                            <Link
                                id="library-link"
                                to="/my-library"
                            >
                                View All <ChevronRight size={11} />
                            </Link>
                        </div>

                        {profileInfo?.previewFolders?.map((folder) => (
                            <Link 
                                key={folder.id}
                                to="/my-library"
                                className="folder-reference"
                            >
                                <div className="folder-bullet-point" style={{ background: folder.color }} />
                                <div className="folder">
                                <p className="folder-name">{folder?.name}</p>
                                <p className="folder-paper-count">{folder?.paperCount} papers</p>
                                </div>
                            </Link>
                        ))}
                    </div>

                    <FollowingAuthors authors={[
                        {id: 1, name: "Author A"},
                        {id: 2, name: "Author B"},
                        {id: 3, name: "Author C"}
                    ]}/>
                    {/*<FollowingAuthors authors={profileInfo?.previewFollowedAuthors}/>*/}
                </aside>
            </div>
        </div>
    );
}

export default ProfilePage;