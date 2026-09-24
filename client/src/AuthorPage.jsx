import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "./hooks/useAuth.jsx";
import AuthorTopics from "./components/authors/AuthorTopics.jsx";
import CitationsChart from "./components/authors/CitationsChart.jsx";
import AuthorLoading from "./components/authors/AuthorLoading.jsx";
import PaperCard from "./components/papers/PaperCard.jsx";
import { Building2, ExternalLink, UserCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import "./styles/authors.css";


function countryFlag(code) {
  if (!code || code.length !== 2) {
	return "";
  }
  
  return code.toUpperCase().replace(/./g, (c) =>
    		String.fromCodePoint(127397 + c.charCodeAt(0))
  		);
}

const INST_TYPE_LABELS = { 
	education: "University", 
	company: "Industry", 
	government: "Government",
  	facility: "Research Facility", 
	nonprofit: "Non-profit", 
	healthcare: "Healthcare",
  	archive: "Archive", 
	other: "Other" 
};



function AuthorPage() {
	const { user } = useAuth();
	const { id: authorId } = useParams();
	const [author, setAuthor] = useState(null);
	const [authorLoading, setAuthorLoading] = useState(true);
	const [following, setFollowing] = useState(false);

	// Loads author data
	async function loadAuthor() {
		setAuthorLoading(true);

		try {
			const response = await fetch(`/api/authors/${authorId}`, {
				credentials: "include"
			});

			if (!response.ok) {
				throw new Error(`Request failed with status ${response.status}`);
			}

			const result = await response.json();

			setAuthor(result?.data ?? {});
			setFollowing(result?.data?.isFollowed ?? false);

		} catch (error) {
			console.error("Failed to fetch author info:", error);
			setAuthor(null);
			setFollowing(false);
		}

		setAuthorLoading(false);
	}

	useEffect(() => {
		loadAuthor();
	}, []);

	// Handler when a user clicks the button to follow an author
	async function followAuthorHandler() {
		try {
			const route = following 
				? `/api/authors/${authorId}/unfollow`
				: `/api/authors/${authorId}/follow`;

			const response = await fetch(route, {
				method: "POST",
				credentials: "include"
			});

			if (!response.ok) {
				throw new Error(`Request failed with status ${response.status}`);
			}

			toast.success(`Successfully ${following ? "unfollowed" : "follow"} the author`);

			setFollowing((prev) => !prev);

		} catch (error) {
			console.error(`Failed to ${following ? "unfollow" : "follow"} author:`, error);
			toast.error(error?.message ?? `Failed to ${following ? "unfollow" : "follow"} author`);
		}
	}


	const initials = author?.displayName.split(" ").map((n) => n[0].toUpperCase()).join("");

	const currentInst = author?.lastKnownInstitutions[0];

	const stats = [
		{ label: "Publications", value: author?.worksCount },
		{ label: "Citations", value: author?.citedByCount },
		{ label: "H-Index", value: author?.hIndex },
		{ label: "i10-Index", value: author?.i10Index },
		{ label: "2yr Mean Citedness", value: author?.twoYearMeanCitedness }  
	];

	const sortedAffiliations = author?.affiliations.sort((a,b) => Math.max(...b.years) - Math.max(...a.years));

	const totalTopicShares = author?.topicShares?.reduce((acc, x) => acc + x.value, 0);

	// Placeholder until the author and their data is fully loaded
	if (authorLoading) {
		return <AuthorLoading />
	}

	return (
		<div id="authors-page">

			{/* Header */}
			<div id="authors-page-header">
				<div id="header-top-row">
					
					{/* Avatar */}
					<div id="header-avatar">
						<span>{initials}</span>
					</div>

					{/* Name and Metadata */}
					<div id="header-name-meta">
						<h1 id="header-author-name">{author?.displayName}</h1>

						{currentInst && (
							<div id="header-inst"> 
								<Building2 size={13} color="#9B9B8A" />
								<span id="header-inst-name">{currentInst?.displayName}</span>
								{currentInst?.countryCode && (
									<span id="header-inst-country">{countryFlag(currentInst?.countryCode)}</span>
								)}
								{currentInst?.institutionType && (
									<span id="header-inst-type">
										{INST_TYPE_LABELS[currentInst?.institutionType] ?? currentInst?.institutionType}
									</span>
								)}
							</div>
						)}

						<div id="header-orcid">
							{author?.orcid && (
								<a 
									href={`https://orcid.org/${author.orcid}`} 
									target="_blank" 
									rel="noopener noreferrer"
									id="header-orcid-link"
								>
									ORCID • {author?.orcid} <ExternalLink size={9} />
								</a>
							)}
						</div>
					</div>

					{/* Follow Button */}
					<button 
						id="header-follow-btn"
						disabled={!user}
						onClick={() => followAuthorHandler()}
					>
						{following ? <UserCheck size={15}/> : <UserPlus size={15} />}
						{following ? "Following" : "Follow"}
					</button>
				</div>

				{/* Stats Strip */}
				<div id="header-stats-strip">
					{stats?.map((stat) => (
						<div 
							key={stat.label}
							className="header-stat"
						>
							<span className="stat-value">{stat.value}</span>
							<span className="stat-label">{stat.label}</span>
						</div>
					))}
				</div>
			</div>

			{/* Main Body of Page */}
			<div id="authors-page-main">
				{/* Main Column */}
				<div id="main-section">
					<AuthorTopics topics={author?.topics} />
					<CitationsChart data={author?.countsByYear} />

					<div id="author-top-papers">
						<p>Top Papers</p>

						<div>
							{author?.topPapers?.map((paper) => (
								<PaperCard key={paper.id} paper={paper} />
							))}
						</div>


					</div>
				</div>

				{/* Sidebar */}
				<aside id="main-sidebar">

					{/* Current Institution */}
					{currentInst && (
						<div id="current-inst-sidebar">
							<p>Current Institution</p>

							<div id="current-inst-info">
								<div id="current-inst-icon">
									<Building2 size={16} color="#6B6B5A" />
								</div>
								<div>
									<p id="current-inst-name">{currentInst?.displayName}</p>
									<p id="current-inst-country">
										{countryFlag(currentInst?.countryCode)}{" "}
										{INST_TYPE_LABELS[currentInst?.institutionType] ?? currentInst?.institutionType}
									</p>
								</div>
							</div>
						</div>
					)}

					{/* Career Timeline */}
					<div id="career-timeline">
						<p>Career History</p>
						
						{/* Affiliations Information */}
						<div>
							{sortedAffiliations?.map((aff, i) => {
								const minYear = Math.min(...aff.years);
								const maxYear = Math.max(...aff.years);

								const yearRange = minYear === maxYear ? `${minYear}` : `${minYear} - ${maxYear}`;
								const isFirst = i === 0;
								const isLast = i === sortedAffiliations?.length - 1;
								
								return (
									<div 
										key={aff.id} 
										className={`author-affiliation ${isLast ? "last" : ""}`}
									>
										<div className="timeline-stamp">
											<div className={`timeline-dot ${isFirst ? "first" : ""}`} />
											{(i < sortedAffiliations?.length - 1) && <div className="timeline-bar" /> }
										</div>

										<div style={{ flex: 1 }}>
											<p className="affiliation-name">
												{aff.displayName}
											</p>
											
											<div className="affiliation-location">
												<span className="affiliation-country">{countryFlag(aff.countryCode)}</span>
												
												{aff?.institutionType && (
													<span className="affiliation-type">
														{INST_TYPE_LABELS[aff.institutionType] ?? aff.institutionType}
													</span>
												)}
											</div>	
										</div>
									</div>
								);
							})}
						</div>
					</div>

					{/* Topic Share */}
					<div id="topics-share">
						<p>Top Research Interests</p>
						
						<div>
							{author?.topicShares?.map((topic) => {
								const normalizedValue = topic?.value / totalTopicShares;
								
								return (
									<div>
										<div className="topic-share">
											<span className="topic-name">{topic?.displayName}</span>
											<span className="topic-value">{(normalizedValue * 100).toFixed(1)}%</span>
										</div>
										
										<div className="percentage-bar">
											<div 
												className="percentage-value" 
												style={{
													width: `${normalizedValue * 100}%`,
													background: `hsl(${140 + normalizedValue * 20}, ${50 + normalizedValue * 20}%, ${35 + normalizedValue * 10}%)`
												}}
											/>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</aside>
			</div>
		</div>
	);
}

export default AuthorPage;