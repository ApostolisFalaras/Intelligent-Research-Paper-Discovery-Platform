import ProfileInfo from "./../profile/ProfileInfo.jsx";
import ProfileAvatar from "./../profile/ProfileAvatar.jsx";
import SearchHistoryList from "./../profile/SearchHistoryList.jsx";
import FolderList from "./../profile/FolderList.jsx";

function ProfilePage() {
    return (
        <div>
            <ProfileAvatar user={null} />
            <ProfileInfo user={null} />
            <SearchHistoryList history={[]} />
            <FolderList folders={[]} />
        </div>
    );
}

export default ProfilePage;