import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import PaperCard from "./components/papers/PaperCard.jsx";
import "./styles/explore.css";
import { ArrowLeft, ArrowRight } from "lucide-react";


const TOPIC_COLORS = [
    { text: "#2D6A4F", background: "#EDF7F1", border: "#B7DCC7" },
    { text: "#3B5B92", background: "#EEF3FA", border: "#C5D3EA" },
    { text: "#7A5A20", background: "#FAF5E8", border: "#E6D5A8" },
    { text: "#7B4F78", background: "#F8EFF7", border: "#DFC6DC" },
    { text: "#9A4F45", background: "#FBF0EE", border: "#E8C5C0" },
    { text: "#42727A", background: "#EDF7F8", border: "#BEDDE0" },
    { text: "#6B5A8E", background: "#F2EFF8", border: "#D1C7E4" },
    { text: "#5F6F3A", background: "#F2F6E9", border: "#CFDCAE" }
];

function getTopicColor(topic = "") {
    let hash = 0;

    for (let i = 0; i < topic.length; i++) {
        hash = topic.charCodeAt(i) + ((hash << 5) - hash);
    }

    return TOPIC_COLORS[Math.abs(hash) % TOPIC_COLORS.length];
}


function ExploreTopicPage() {
	const { id: topicId } = useParams();

	const [topicInfo, setTopicInfo] = useState([]);
	const [sort, setSort] = useState("Default");
	const [page, setPage] = useState(1);


	async function loadExploreTopic() {
		try {
			console.log(topicId);
			const response = await fetch(`/api/explore/${topicId}?page=${page}&limit=15`, {
				credentials: "include"
			});

			if (!response.ok) {
				throw new Error(`Request failed with status ${response.status}`);
			}

			const result = await response.json();
			setTopicInfo(result?.data ?? {});
			
			console.log(result?.data);

		} catch (error) {
			console.error("Failed to fetch topic info:", error);
			setTopicInfo({});
		}
	}

	// Scroll to the top of the page
	useEffect(() => {
		window.scrollTo({ top: 0, left: 0, behavior: "instant"});
	}, []);
	
	useEffect(() => {
		loadExploreTopic();
	}, [page]);


	// Memoized (Cached) computation that calculates ordering of papers
	// based on one of the sorting options
	const sortedPapers = useMemo(() => {
		if (!topicInfo?.topic) {
			return [];
		}
		const papers = [...topicInfo?.papers];
		
		if (sort === "Recent") {
			return papers.sort((a, b) => b.publicationYear - a.publicationYear);
		}

		if (sort === "Most cited") {
			return papers.sort((a,b) => b.citedByCount - a.citedByCount);
		}
		return papers;
	}, [topicInfo, sort]);

	const totalPapers = topicInfo?.totalResults;
	const totalPages = Math.max(1, Math.ceil(totalPapers / 15));
	console.log(totalPages);

	return (
		<div id="explore-topic-page">
			{/* Header */}
			<div id="explore-topic-header">
				<div>
					<span id="explore-topic-point" style={{ backgroundColor: getTopicColor(topicInfo?.topic?.displayName).text ?? "#1B4332"}} />
					<span id="explore-topic-field">{topicInfo?.topic?.fieldDisplayName}</span>
				</div>
				<h1>{topicInfo?.topic?.displayName ?? "Topic Name"}</h1>
				<p id="explore-topic-total">{topicInfo?.totalResults} papers</p>
			</div>

			{/* Sort Controls */}
			<div id="explore-topic-sorting">
				<div>
					{["Default", "Recent", "Most cited"].map((option) => (
						<button
							key={option}
							className={`explore-sorting-btn ${sort === option ? "active" : ""}`}
							onClick={() => {
								setSort(option);
								setPage(1);
							}}
						>
							{option}
						</button>
					))}
				</div>
			</div>

			{/* Grid of Papers */}
			<div id="explore-paper-grid">
				{sortedPapers.map((paper) => (
					<PaperCard 
						key={paper.id} 
						paper={paper}
						topicColor={getTopicColor(topicInfo?.topic?.displayName).text ?? "#1B4332"}
					/>
				))}
			</div>

			{/* Pagination Number Buttons */}
			{totalPages > 1 && (
				<div id="explore-topic-pages">
					<button 
						id="explore-prev-btn"
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
								<span key={`ellipsis-${i}`} className="explore-ellipsis">…</span>
							) : (
								<button 
									key={p} 
									className={`explore-page-number ${p === page ? "active" : ""}`}
									onClick={() => setPage(p)}
								>
								{p}
								</button>
							)
						)
					}
					

					<button 
						id="explore-next-btn"
						className={page === totalPages ? "page-N" : ""}
					>
						Next <ArrowRight size={12} />
					</button>
				</div>
			)}
		</div>
	);
}

export default ExploreTopicPage;