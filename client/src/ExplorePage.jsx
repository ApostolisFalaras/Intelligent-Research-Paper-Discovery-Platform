import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigationType } from "react-router-dom";
import { useExplore } from "./hooks/useExplore.jsx";
import TopicRow from "./components/explore/TopicRow.jsx";
import { Shuffle } from "lucide-react";
import "./styles/explore.css";
import ExploreLoading from "./components/explore/ExploreLoading.jsx";


function ExplorePage() {
    const [shuffling, setShuffling] = useState(false);
    const [topics, setTopics] = useState([]);
    const [topicsStatus, setTopicsStatus] = useState("loading");

    // Access cached information about a potential explore topics
    // that might need to be restored according to the navigation type
    const navigationType = useNavigationType();
    const { cachedTopics, setCachedTopics } = useExplore();

    const initializedRef = useRef(false);

    // Fetch random topics
    const loadRandomTopics = useCallback(async () => {
        try {
            setTopicsStatus("loading");

            const response = await fetch("/api/explore", {
                credentials: "include"
            });

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }

            const result = await response.json();

            setTopics(result?.data ?? []);
            setCachedTopics(result?.data ?? []);
            
            setTopicsStatus("success");

        } catch (error) {
            console.error("Failed to fetch random topics:", error);
            
            setTopics([]);
            setTopicsStatus("error");

        }
    }, [setCachedTopics]);

    // Decide whether to use the cached topics or load a new random set of topics
    useEffect(() => {
        if (initializedRef.current) {
            return;
        }

        initializedRef.current = false;
        
        if (navigationType === "POP" && cachedTopics !== null) {
            setTopics(cachedTopics);
            setTopicsStatus("success");
            return;
        }

        loadRandomTopics();
    }, [navigationType, cachedTopics, loadRandomTopics]);


    // Shuffle topics
    async function handleShuffle() {
        setShuffling(true);

        await loadRandomTopics();

        setShuffling(false);
    }


    return (
        <>
            {/* Header */}
            <div id="explore-page-header">
                <div>
                    <div>
                        <p id="explore-num-topics">Discovery feed • {topics?.length} topics</p>
                        <h1 id="explore-title">Explore</h1>
                        <p id="explore-msg">A random selection of research areas. Shuffle anytime to discover something new.</p>
                    </div>

                    <button 
                        id="explore-shuffle-btn" 
                        className={shuffling ? "shuffling" : ""}
                        disabled={shuffling}
                        onClick={handleShuffle}
                    >
                        <Shuffle size={14} id="shuffle-icon" className={shuffling ? "shuffling" : ""} />
                        {shuffling ? "Shuffling..." : "Shuffle topics"}
                    </button>
                </div>
            </div>

            {/* Main Topic Rows */}
            <main id="explore-topic-rows">
                {topicsStatus === "loading" ? (
                    <ExploreLoading />
                ) : topicsStatus === "error" ? (
                    <p>Could not load topics</p>
                ) : (
                topics?.map((topicPreview) => (
                    <TopicRow key={topicPreview?.topic?.id} topicPreview={topicPreview} />
                )))}
            </main>
        </>
    );
}

export default ExplorePage;