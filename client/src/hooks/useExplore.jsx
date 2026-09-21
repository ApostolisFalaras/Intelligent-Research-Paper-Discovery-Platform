import { useContext } from "react";
import { ExploreContext } from "./../context/ExploreContext.jsx";

export function useExplore() {
	const context = useContext(ExploreContext);

	if (!context) {
		throw new Error("useExplore must be used inside an ExploreProvider");
	}

	return context;
}