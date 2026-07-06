import Hero from "./components/home/Hero.jsx";
import StatsStrip from "./components/home/StatsStrip.jsx";
import RecommendationsSection from "./components/home/RecommendationsSection.jsx";

function HomePage() {
    return (
        <>
            <Hero />
            <StatsStrip />
            <RecommendationsSection firstName="Apostolis" lastName="Falaras" />
        </>
    );
}

export default HomePage;