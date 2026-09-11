import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "./hooks/useAuth.jsx";
import { Link } from "react-router-dom";
import { ArrowUpRight, Award, Bookmark, BookmarkCheck, ChevronUp, ChevronDown, ChevronRight, ExternalLink, Database, FileText } from "lucide-react";
import OABadge from "./components/papers/OABadge.jsx";
import StatsCard from "./components/papers/StatsCard.jsx";
import "../src/styles/papers.css";
import PaperModal from "./components/papers/PaperModal.jsx";
import { toast } from "sonner"; 



// Constant
const ABSTRACT_CHAR_LIMIT = 320;

// Helper functions
function calculateNumberOfCounties(paper) {
	const countries = new Set();

	for (const author of paper?.authors ?? []) {
		for (const institution of author?.institutions ?? []) {
			
			if (institution?.countryCode) {
				countries.add(institution?.countryCode);
			}
		}
	}

	return countries.size;
}

function calculateNumberOfInstitutions(paper) {
	const institutions = new Set();

	for (const author of paper?.authors ?? []) {
		for (const institution of author?.institutions ?? []) {
			
			if (institution?.id) {
				institutions.add(institution?.id);
			}
		}
	}

	return institutions.size;
}


function PaperPage() {
	const { user } = useAuth();
	const { id } = useParams();

	const [paper, setPaper] = useState(null);
	const [saved, setSaved] = useState(false);

	const [expandedAbstract, setExpandedAbstract] = useState(false);
	const shortAbstract = paper?.abstract?.slice(0, ABSTRACT_CHAR_LIMIT) ?? "";
	const requiresTruncate = paper?.abstract?.length > ABSTRACT_CHAR_LIMIT;

	const [openModal, setOpenModal] = useState(false);

	async function loadPaper(id) {
		try {
			const response = await fetch(`/api/papers/${id}`, {
				credentials: "include",
			});

			if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }

			const results = await response.json();
			const loadedPaper = results.data ?? null;

        	setPaper(loadedPaper);
        	setSaved(loadedPaper?.isSaved ?? false);
			
			return results.data;

		} catch (error) {
			console.error("Failed to load paper:", error);
			setPaper(null);

			return false;
		}
	}

	async function recordPaperView(id) {
		try {
			const response = await fetch(`/api/papers/${id}/view`, {
				method: "POST",
				credentials: "include"
			});

			if (!response.ok) {
				throw new Error(`Request failed with status ${response.status}`);
			}

			
		} catch (error) {
			console.error("Failed to record paper view:", error);
		}
	}

	useEffect(() => {
		async function openPaper() {
			const loadedPaper = await loadPaper(id);

			if (loadedPaper) {
				await recordPaperView(loadedPaper.internalId);
			}
		}

		openPaper();
	}, [id]);

	return (
		<div id="paper-page">
			{/* Main Paper Features */}
			<div>
				
				{/* Paper Type, Badge, & Retracted status */}
				<div id="type-badge-div">
					<span className="type">{paper?.publication.type}</span>

					<OABadge status={paper?.access.status} />

					{paper?.metrics?.top1Percent && (
						<span className="top-1-percent">
							<Award size={10} /> Top 1%
						</span>
					)}

					{paper?.flags?.isRetracted && (
						<span className="retracted">Retracted</span>
					)}
				</div>

				{/* Paper Title (displayName is the title, 
				    or a guaranteed alternative if title doesn't exist) */}
				<h1 id="paper-title">
					{paper?.displayName}
				</h1>

				{/* Authors */}
				<div id="paper-author-names">
					{paper?.authors.map((author, index) => (
						author?.authorExists === true ? (
							<Link 
								key={author.id}
								to={`/authors/${author.id}`}
								className="author-name-link"
							>
								{author?.displayName}{ index < paper?.authors.length-1 ? "," : ""}
							</Link>
						) :
							<span className="author-name-not-link">
								{author?.displayName}{ index < paper?.authors.length-1 ? "," : ""}
							</span>
					))}
				</div>

				{/* Venue & Date */}
				<div id="paper-venue">
					<span className="primary-source">{paper?.source.name}</span>

					{paper?.source.volume && (
						<span className="biblio-info">
							{paper?.source?.volume ? `Vol. ${paper?.source?.volume}` : ""}
							{paper?.source?.pages ? `, pp. ${paper?.source?.pages}`: ""}
						</span>
					)}

					<span className="publication-date">{paper?.publication?.date}</span>
				</div>

				{/* Action Buttons */}
				<div id="action-buttons">
					{paper?.access.isOpenAccess && (
						<a 
							href={paper?.access.bestURL}
							target="_blank"
							rel="noreferrer"
							className="external-link"
						>
							<ExternalLink size={13} /> Read Paper
						</a>
					)}

					<button 
						className="save-btn"
						onClick={() => setOpenModal(true)}
						disabled={!user}
					>
						{saved ? <BookmarkCheck size={13} /> : <Bookmark size={13}/>}
						{saved ? "Saved": "Save"}
					</button>

					{paper?.doi && (
						<a
							href={paper?.doi}
							target="_blank"
							rel="noreferrer"
							className="paper-doi-link"
						>
							DOI <ArrowUpRight size={13}/>
						</a>
					)}
				</div>

				{/* Abstract section */}
				<section id="abstract-section">
					<h2>Abstract</h2>
					<p>
						{expandedAbstract || !requiresTruncate 
							? paper?.abstract 
							: `${shortAbstract}...`}
					</p>

					{requiresTruncate && (
						<button
							className="abstract-btn"
							onClick={() => setExpandedAbstract((prev) => !prev)}
						>
							{expandedAbstract 
								? <ChevronUp size={14} style={{transition: "transform 0.2s" }} /> 
								: <ChevronDown size={14} style={{transition: "transform 0.2s" }} />
							}
							{expandedAbstract ? "Show less" : "Read full abstract"}
						</button>
					)}
				</section>

				{/* Research Classification section */}
				<section id="research-classification-section">
					<h2>Research Classification</h2>
					<div>
						{[
							{level: "Domain", value: paper?.topic?.domain},
							{level: "Field", value: paper?.topic?.field},
							{level: "Subfield", value: paper?.topic?.subfied},
							{level: "Topic", value: paper?.topic?.name}
						].map(({level, value}, index, arr) => (
							
							<div
								key={level}
								className={`research-level ${index == 0 ? "first" : ""} ${index == arr.length-1 ? "last": ""}`}
							>
								<span className="level">
									{level}
								</span>
								
								<ChevronRight size={12} color="#D1D1C7" style={{flexShrink: 0}} />
								
								<span className="value">
									{value ? value : "-"}
								</span>
							</div>
						))}
					</div>
				</section>

				<section id="authors-section">
						<h2>
							Authors ({paper?.authors.length})
						</h2>

						<div>
							{paper?.authors.map((author) => (
								<Link 
									key={author?.id}
									to={`/authors/${author.id}`}
									className="author-link"
								>
									<div className="author-avatar">
										<span className="author-initials">
											{author?.displayName.split(" ").map((n) => n[0]).slice(0,2).join("")}
										</span>
									</div>
									<div style={{minWidth: 0}}>
										<p className="author-name">
											{author?.displayName}
										</p>
										<p className="author-affiliation">
											{author?.affiliations[0]?.rawString}
										</p>
									</div>
								</Link>
							))}
						</div>
				</section>

				{/* Indexed In */}
				<section>
					<h2 id="indexed-in">
						Indexed In
					</h2>
					<div id="indexed-in-list">
						{paper?.indexedIn.map((indexed) => (
							<span 
								key={indexed}
								className="indexed-in-option"
							>
								<Database size={14} color="#9B9B8A"/> {indexed}
							</span>
						))}
					</div>
				</section>
			</div>

			

			{/* Right Sidebar with Paper Metrics*/}
			<div id="right-sidebar-features">
				
				{/* Citation Stats */}
				<div>
					<p id="citations-title">Citations Metrics</p>
					<div id="citations-metrics">
						<StatsCard 
							label="Cited by" 
							value={paper?.metrics?.citedByCount ?? "-"} 
							sublabel={`${paper?.publication.year} – present`} 
							accent
						/>
						<StatsCard 
							label="FWCI" 
							value={paper?.metrics?.fwci ? `${paper?.metrics?.fwci.toFixed(1)}`: "-"}
							sublabel="Field-weighted" 
							/>
						<StatsCard 
							label="Percentile" 
							value={paper?.metrics?.citationPercentile ? `${(paper?.metrics?.citationPercentile * 100).toFixed(1)}%` : "-"} 
							sublabel="vs. same type/year" 
						/>
						<StatsCard 
							label="References" 
							value={paper?.metrics?.referencedWorksCount ?? "-"} 
							sublabel="works cited"
						/>
					</div>
				</div>

				{/* Open Access Status */}
				<div id="open-access-status">
					<p>Access</p>
					<div>
						<OABadge status={paper?.access.status} />
						
						{paper?.access.hasPDF && (
							<div className="has-pdf">
								<FileText size={12} /> PDF Available
							</div>
						)}

						{paper?.access.isOpenAccess && (
							<a
								className="has-best-url"
								href={paper?.access.bestURL}
								target="_blank"
								rel="noreferrer"
							>
								{paper?.access.bestURL}
							</a>
						)}
					</div>
				</div>

				{/* Publication Details */}
				<div id="publication-details">
					<p>Publication Details</p>
					{[
						{ label: "Venue", value: paper?.source.name },
						{ label: "Type", value: paper?.publication.type },
						{ label: "Year", value: paper?.publication.year },
						{ label: "Language", value: paper?.publication.language },
						paper?.source.volume ? { label: "Volume", value: paper?.source.volume} : null,
						paper?.source.pages ? { label: "Pages", value: paper?.source.pages } : null
					].filter(Boolean).map((detail) => (
						<div key={detail.label} className="detail">
							<span className="detail-label">{detail.label}</span>
							<span className="detail-value">{detail.value}</span>
						</div>
					))}
				</div>

				{/* Paper Reach */}
				<div id="paper-reach">
					<p>Reach</p>
					<div>
						<div>
							<p className="countries">{calculateNumberOfCounties(paper)}</p>
							<p>countries</p>
						</div>
						<div>
							<p className="institutions">{calculateNumberOfInstitutions(paper)}</p>
							<p>institutions</p>
						</div>
					</div>
				</div>
			</div>

			{openModal && 
			<PaperModal
				mode={saved ? "unsave" : "save"}
				open={openModal}
				paperId={paper?.id}
				paperInternalId={paper?.internalId}
				paperTitle={paper?.title}
				onClose={() => setOpenModal(false)}
				onSaved={({ isSaved, folderIds }) => {
					setSaved(isSaved);

					if (isSaved) {
						toast.success(
							`Saved in ${folderIds.length} ${folderIds.length === 1 ? "collection" : "collections"}`,
							{ duration: 2800 }
						);
					} else {
						toast.success("Removed from all collections",
							{ duration: 2800 }
						);
					}
				}}
			/>}
		</div>
	);
}

export default PaperPage;