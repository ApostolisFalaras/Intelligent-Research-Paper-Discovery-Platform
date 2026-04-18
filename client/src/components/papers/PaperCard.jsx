import { Link } from "react-router-dom";

function PaperCard({ paper }) {
    // The whole result card becomes a clickable link
    // that will redirect the user to the paper page
    
    return (
        <Link to={`papers/${paper.id}`} className="paper-card">
            <h3>{paper.title}</h3>
            <p>{paper.authors?.join(", ")}</p>
            <p>{paper.publicationYear}</p>
            <p>{paper.topicCategory}</p>
        </Link>        
    );
}

export default PaperCard;