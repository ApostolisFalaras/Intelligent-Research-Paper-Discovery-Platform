import { Link } from "react-router-dom";
import PaperCard from "./../papers/PaperCard.jsx";

function RecommendationSection({ title, papers, viewMoreLink }) {
    // Providing the first 4 recommendations as a preview
    // when users enter the home page of the application
    const previewPapers = papers.slice(0, 4);

    return (
        <section>
            <div>
                <h2>{title}</h2>
                <Link to={viewMoreLink}>View More</Link>
            </div>

            <div>
                {previewPapers.map((paper) => (
                    <PaperCard key={paper.id} paper={paper} />
                ))}
            </div>
        </section>   
    );
}

export default RecommendationSection;