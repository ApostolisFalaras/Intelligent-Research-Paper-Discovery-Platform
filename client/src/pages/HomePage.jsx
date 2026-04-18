import { RecommendationSection } from "./../recommendations/RecommendationSection.jsx";

function HomePage() {
    return (
        <div>
            <h1>Home</h1>

            {/* Setting empty list list as a temporary placeholder for the paper property */}
            <RecommendationSection 
                title="Based on your history"
                papers={[]}
                viewMoreLink="/recommendations?type=content-based"
            />

            <RecommendationSection 
                title="User with similar intersests also viewed"
                papers={[]}
                viewMoreLink="/recommendations?type=user-based"
            />
        </div>
    );
}

export default HomePage;