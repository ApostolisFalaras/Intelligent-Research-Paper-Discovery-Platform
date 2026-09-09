import { useState, useEffect } from "react";
import { useAuth } from "./hooks/useAuth.jsx";
import Hero from "./components/home/Hero.jsx";
import StatsStrip from "./components/home/StatsStrip.jsx";
import RecommendationsSection from "./components/home/RecommendationsSection.jsx";

function HomePage() {
	const { user } = useAuth();
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

	// Add user as a dependency, so that recommendation sections change
	// when the user moves from "signed out" -> "logged in" and "logged in" -> "signed out"
	useEffect(() => {
		loadHomeRecommendations();
	}, [user]);

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