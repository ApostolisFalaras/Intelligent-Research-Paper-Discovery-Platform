import { createContext } from "react";

// Custom context that retains the current randomly-selected batch of exploration topics
// when the ExplorePage unmounts from the page
export const ExploreContext = createContext(null);

