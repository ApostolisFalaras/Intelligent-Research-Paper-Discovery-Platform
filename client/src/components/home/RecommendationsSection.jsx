import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth.jsx";
import { Star, Users, TrendingUp, Compass, History } from "lucide-react";
import RecommendationsRow from "./RecommendationsRow.jsx";
import RecommendationLoading from "./RecommendationLoading.jsx";
import FetchError from "../common/FetchError.jsx";
import "./../../styles/home.css";

const sectionIcons = {
	"Popular papers": <TrendingUp size={15} />,
    "Because you viewed": <History size={15} />,
    "Based on your interests": <Star size={15} />,
    "Researchers with similar interests also viewed": <Users size={15} />,
    "Explore your research topics": <Compass size={15} />
};

function RecommendationsSection({ recommendations, status, fetchError, retrySearch }) {
	const { user } = useAuth();
	const isAuthenticated = user ? true : false;
	
	
	if (status === "loading") {
		return (
			<RecommendationLoading />
		);
	}

	if (status === "error") {
		return (
			<FetchError fetchError={fetchError} retrySearchQuery={retrySearch} />
		);
	}

	return (
		<div id="main-section">
			<div id="main-section-header">
				{isAuthenticated ? (
					<>
						<p>Personalized recommendations • {user.firstName} {user.lastName}</p>
						<h2>Your research feed</h2>
					</>
				) : (
					<>
						<p>Discover what researchers are reading</p>
						<h2>Popular research</h2>
					</>
				)}
			</div>

			{recommendations.sections.map((section) => (
				<RecommendationsRow
					key={section.header}
					label={section.header}
					icon={sectionIcons[section.header]}
					papers={section.papers}
				/>
			))}
		</div>
	);
}

export default RecommendationsSection;