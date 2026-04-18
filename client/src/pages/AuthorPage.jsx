import AuthorInfo from "./../authors/AuthorInfo.jsx";
import PaperGrid from "./../papers/PaperGrid.jsx";

function AuthorPage() {
    return (
        <div>
            <AuthorInfo author={null} />
            <PaperGrid papers={[]} />
        </div>
    );
}

export default AuthorPage;