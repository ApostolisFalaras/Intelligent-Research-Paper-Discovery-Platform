import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router";
import { Star, Users, Compass, TrendingUp, ArrowLeft, ArrowRight } from "lucide-react";
import PaperCard from "./components/papers/PaperCard.jsx";
import "./styles/recommendations.css";


const TYPE_META = {
	popular: { label: "Popular papers", icon: TrendingUp },
	activity: { label: "Based on your activity", icon: Star },
	similar: { label: "Researchers with similar interests also viewed", icon: Users },
	topics: { label: "Explore your research topics", icon: Compass }
};


function RecommendationsPage() {
	// Get type of recommendations
	const [searchParams, setSearchParams] = useSearchParams();
	const type = searchParams.get("type") ?? "activity";
	
	const typeMetadata = TYPE_META[type]; 
	const Icon = typeMetadata?.icon;

	console.log(typeMetadata);
	const [page, setPage] = useState(1);
	const [recommendationInfo, setRecommendationInfo] = useState(null);


	async function loadRecommendations() {
		try {
			const response = await fetch(`/api/recommendations?type=${type}&page=${page}&limit=15`, {
				credentials: "include"
			});

			if (!response.ok) {
				throw new Error(`Request failed with status ${response.status}`);
			}

    		const result = await response.json();
			
			setRecommendationInfo(result?.data ?? null);

		} catch (error) {
			console.log("Failed to fetch recommendations with error:", error);
			setRecommendationInfo(null);
		}
	}

	// Scroll to the top of the page
	useEffect(() => {
		window.scrollTo({ top: 0, left: 0, behavior: "instant"});
	}, []);

	useEffect(() => {
		loadRecommendations();
	}, [type, page]);

	const totalPages = Math.ceil(recommendationInfo?.totalPapers / 15);


	return (
		<div id="recommendations-page">
			
			{/* Header */}
			<div id="recommendations-header">
				<div id="header-type">
					<div><Icon size={15} color="#2D6A4F"/></div>
					<h1>{typeMetadata?.label}</h1>
				</div>
			</div>

			{/* Type Switching Buttons */}
			<div id="recommendation-type-btns">
				{recommendationInfo?.availableTypes?.map((typeOption) => {
					const metadata = TYPE_META[typeOption];
					const TypeIcon = metadata.icon;

					const active = typeOption === type;
					return (
						<Link
							key={typeOption}
							to={`/recommendations?type=${typeOption}`}
							className={`type-btn ${active ? "active" : ""}`}
							onClick={() => { 
								setSearchParams({
									type: typeOption
								});

								setPage(1);
							}}
						>
							<TypeIcon size={14} /> {metadata?.label}
						</Link>
					)
				})}
			</div>

			{/* Grid */}
			<div id="papers-grid">
				{recommendationInfo?.papers?.map((paper) => (
					<PaperCard key={paper.id} paper={paper} />
				))}
			</div>

			{/* Pagination Number Buttons */}
			{totalPages > 1 && (
				<div id="recommendation-pages">
					<button 
						id="recom-prev-btn"
						className={page === 1 ? "page-1" : ""}
					>
						<ArrowLeft size={12} /> Prev
					</button>

					{/* 
						1. Generate the sequence of the available pages
						2. Keep the first, previous, current, next, and last page number
						3. Create array of pagination components (numbers and ...)
						4. Display each type of element differently
					*/}
					{Array.from({ length: totalPages }, (_, i) => i + 1)
						.filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
						
						.reduce((acc, p, idx, arr) => {
							if (idx > 0 && (p) - (arr[idx - 1]) > 1) {
								acc.push("…");
							}
							acc.push(p);
							return acc;
						}, [])

						.map((p, i) =>
							p === "…" 
							? (
								<span key={`ellipsis-${i}`} className="recom-ellipsis">…</span>
							) : (
								<button 
									key={p} 
									className={`recom-page-number ${p === page ? "active" : ""}`}
									onClick={() => setPage(p)}
								>
								{p}
								</button>
							)
						)
					}
					

					<button 
						id="recom-next-btn"
						className={page === totalPages ? "page-N" : ""}
					>
						Next <ArrowRight size={12} />
					</button>
				</div>
			)}
			
		</div>
	);

}

export default RecommendationsPage;