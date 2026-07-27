import { useState, useEffect, useRef, useMemo } from "react";
import { useTopics } from "../../hooks/useTopics.jsx";
import { Search, X, ChevronDown, Check } from "lucide-react";
import "../../styles/search.css";

function TopicSelect({ value, onChange }) {
	// Fetch available topics
	const { topics, loading, error, refresh } = useTopics();

	// Open dropdown & embedded search bar states
	const [isOpen, setIsOpen] = useState(false);
	const [search, setSearch] = useState("");

	// Reference to the <TopicSelect> element & embedded search bar respectively
	const ref = useRef(null);
	const searchRef = useRef(null);

	// clicks outside of the <TopicSelect> element close the open topics dropdown
	useEffect(() => {
		function handleClickOutside(event) {
			if (ref.current && !ref.current.contains(event.target)) {
				setIsOpen(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	useEffect(() => {
		if (isOpen) {
			const timeoutId = setTimeout(() => {
				searchRef.current?.focus();
			}, 50);

			return () => clearTimeout(timeoutId);
		}

		setSearch("");
	}, [isOpen]);

	// Memoize the selected topic computation
	const selected = useMemo(() => {
		if (!value) {
			return null;
		}

		return topics.find((topic) => topic.topicId === value) ?? null;
	}, [topics, value]);

	/* Memoize the computation that filters topics based on the user's seach query in the 
	dropdown's search bar */
	const filteredTopics = useMemo(() => {
		const query = search.trim().toLowerCase();

		if (!query) {
			return topics;
		}

		return topics.filter((topic) => {
			const name = topic.topicName?.toLowerCase() ?? null;
			const field = topic.fieldName?.toLowerCase() ?? null;

			return (
				name.includes(query) || field.includes(query)
			);
		});
	}, [topics, search]);


	/* Memoize the computation that groups topics based on their corresponding field
	The grouping happens dynamically as the user types in the search bar */
	const groupedTopics = useMemo(() => {
		const grouped = new Map();

		for (const topic of filteredTopics) {
			const field = topic.fieldName || "Other";

			if (!grouped.has(field)) {
				grouped.set(field, []);
			}

			grouped.get(field).push(topic);
		}

		return grouped;
	}, [filteredTopics]);


	return (
		<div ref={ref} style={{position: "relative"}}>
			{/* Dropdown toggle button that also displays the selected option */}
			<button
				type="button"
				onClick={() => {
					if (!loading) {
						setIsOpen((prev) => !prev);
					}
				}}
				id="topic-dropdown-btn"
			>
				<span id="topic-selected">
					{loading 
						? "Loading topics..." 
						: selected ? selected.topicName : "Select a topic..."}
				</span>

				{/* X icon appears only after a selection has been made
				    and the Chevron icon rotates according to the dropdown's open status */}
				<span id="topic-selected-icons">
					{selected && (
						<span 
							id="topic-clear-selected"
							onClick={(event) => {
								event.stopPropagation();
								onChange("");
							}}
						>
							<X size={11} />
						</span>
					)}
					<ChevronDown 
						size={12} 
						id="topic-dropdown-chevron"
						className={isOpen ? "open" : ""}
					/>
				</span>
			</button>

			{/* Open Dropdown */}
			{isOpen && (
				<div id="topic-dropdown-container">
					<div id="topic-dropdown-search-container">
						<div>
							<Search size={11} id="topic-dropdown-search-icon" />
							<input 
								type="text"
								ref={searchRef}
								value={search}
								onChange={(event) => setSearch(event.target.value)}
								placeholder="Search topics..."
								id="topic-dropdown-search"
							/>

							{search && (
								<button 
									id="clear-dropdown-search-btn"
									onClick={() => setSearch("")}
								>
									<X size={10} />
								</button>
							)}
						</div>
					</div>

					<div id="topic-dropdown-list">
						{loading ? (
							<p className="topic-dropdown-status">Loading topics...</p>
						) : error ? (
							<div>
								<p>{error.message || "Unable to load topics"}</p>
								<button
									type="button"
									onClick={refresh}
									className="topic-dropdown-retry"
								>
									Try again
								</button>
							</div>
						) : groupedTopics.size === 0 ? (
							<p id="no-topics-match">
								No topics match "{search}"
							</p>
						) : (
							Array.from(groupedTopics.entries()).map(([field,topics]) => (
								<div key={field}>
									<p className="field-header">{field}</p>

									{topics.map((topic) => {
										const active = topic.topicId === value;

										return (
											<button
												type="button"
												key={topic.topicId}
												className={`topic-option ${active ? "active" : ""}`}
												onClick={() => {
													onChange(topic.topicId);
													setIsOpen(false);
												}}
											>
												<span className={`topic-option-name ${active ? "active": ""}`}>
													{topic.topicName}
												</span>

												<span className="topic-option-id-container">
													<span className={`topic-option-id ${active ? "active" : ""}`}>
														{topic.topicId}
													</span>
													{active && <Check size={11} color="#1B4332" />}
												</span>
											</button>
										)
									})}
								</div>
							))
						)}
					</div>
				</div>
			)}
		</div>
	);
}

export default TopicSelect;