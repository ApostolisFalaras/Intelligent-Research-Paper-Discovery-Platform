import { useState } from "react";

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