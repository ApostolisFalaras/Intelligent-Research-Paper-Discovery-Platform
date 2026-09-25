import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import "./../../styles/authors.css";


function AuthorTopics({ topics = [] }) {
	const [expanded, setExpanded] = useState(false);

	// Map used to organize topics by their subfield
	const topicsBySubfield = new Map();

	for (const topic of topics) {
		if (!topicsBySubfield.has(topic?.subfield)) {
			topicsBySubfield.set(topic?.subfield, []);
		}

		topicsBySubfield.get(topic?.subfield).push(topic);
	}

	const entries = Array.from(topicsBySubfield.entries());
	const visible = expanded ? entries : entries.slice(0,2);

	return (
		<div id="author-topics">
			<p>Research Areas</p>
			
			{/* Subfield rows with the topics + number of papers that belong in each one */}
			<div id="topics-container">
				{visible?.map(([subfield, topicsArray]) => (
					<div key={subfield}>
						<p className="topic-field-subfield">{topicsArray[0].field} • {subfield}</p>
						
						<div className="topics-row">
							{topicsArray?.map((topic) => (
								<span 
									key={topic.id} 
									className="topic-row-entry"
								>
									{topic?.displayName}
									<span>{topic?.worksCount}</span>
								</span>
							))}
						</div>
					</div>
				))}
			</div>

			{entries.length > 2 && (
				<button
					id ="expand-topics-btn"
					onClick={() => setExpanded((prev) => !prev)}
				>
					{expanded 
						? <><ChevronUp size={13} /> Show less</>
						: <><ChevronDown size={13} /> Show more</>
					}
				</button>
			)}
		</div>
	);

}

export default AuthorTopics;