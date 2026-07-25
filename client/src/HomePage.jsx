import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import Hero from "./components/home/Hero.jsx";
import StatsStrip from "./components/home/StatsStrip.jsx";
import RecommendationsSection from "./components/home/RecommendationsSection.jsx";

function HomePage() {
    const [recomSections, setRecomSections] = useState(null);
	const [status, setStatus] = useState("loading");
	const [fetchError, setFetchError] = useState("");

	async function loadHomeRecommendations() {
		try {
			const res = await fetch("/api/recommendations/home", {
				credentials: "include"
			});

			let result = await res.json();
			
			setRecomSections(result.data);
			setStatus("success");

		} catch (error) {
			console.log("Failed to fetch recommendations:", error);

			setRecomSections(null);
			setStatus("error");
			setFetchError("Could not load recommendations. Check your connection and try again.")
		}
	}

	useEffect(() => {
		loadHomeRecommendations();
	}, []);

    return (
        <main>
            <Hero />
            <StatsStrip />
            <RecommendationsSection 
				recommendations={recomSections} 
				status={status}
				fetchError={fetchError}
				retrySearch={loadHomeRecommendations}
			/>
        </main>
    );
}

export default HomePage;