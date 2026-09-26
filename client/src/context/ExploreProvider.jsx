import { useState } from "react";
import { ExploreContext } from "./ExploreContext.jsx";


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