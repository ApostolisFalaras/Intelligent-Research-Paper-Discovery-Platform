import { createContext, useState } from "react";

// Custom context that retains the current randomly-selected batch of exploration topics
// when the ExplorePage unmounts from the page
export const ExploreContext = createContext(null);

export function ExploreProvider({ children }) {
	const [cachedTopics, setCachedTopics] = useState(null);

	return (
		<ExploreContext.Provider
			value={{
				cachedTopics,
				setCachedTopics
			}}
		>
			{children}
		</ExploreContext.Provider>
	);
}