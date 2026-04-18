import { Link } from "react-router-dom";
import ProfileAvatar from "./../profile/ProfileAvatar.jsx";

function Sidebar() {
    // Placeholder user and folders list
    const user = {name: "John Doe"};
    const folders = {};

    return (
        <aside className="sidebar">
            <div className="sidebar-user">
                <Link className="sidebar-user-link">
                    <ProfileAvatar variant="small" />
                    <span>{user.name}</span>
                </Link>
            </div>

            <div className="sidebar-folders">
                {folders.map((folder) => {
                    <div key={folder.id} className="sidebar-folder-preview">
                        <h4>{folder.name}</h4>
                        <ul>
                            {folder.papers.slice(0,2).map((paperTitle, index) => {
                                <li key={index}>{paperTitle}</li>
                            })}
                        </ul>
                    </div>
                })}
            </div>

            <Link to="/me/folders" className="sidebar-view-more">
                View More
            </Link>
        </aside>
    );
}

export default Sidebar;