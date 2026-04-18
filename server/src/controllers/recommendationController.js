import { fetchHomeRecommendations,
         fetchContentBasedRecommendations,
         fetchUserBasedRecommendations,
         fetchTopicRecommendations } from "./../services/recommendationService.js";

// Retrieves suggested papers when the user's in the home page
export async function getHomeRecommendations(req, res) {
    try {
        // TODO: user Id to be set after JWT authentication middleware
        const userId = 1;
        const papers = await fetchHomeRecommendations(userId);
        res.status(200).json(papers);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch home page recommendations" });
    }
}

// Retrieves suggested papers based on the user's history
export async function getContentBasedRecommendations(req, res) {
    try {
        const paperId = req.params.id;
        const papers = await fetchContentBasedRecommendations(paperId);
        res.status(200).json(papers);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch content-based recommendations" });
    }
}

// Retrieves suggested papers from users with similar interests
export async function getUserBasedRecommendations(req, res) {
    try {
        //TODO: user Id to be set after JWT middleware authentication
        const userId = 1;
        const papers = await fetchUserBasedRecommendations(userId);
        res.status(200).json(papers);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch collaborative recommendations" });
    }
}

// Retrieves suggested papers based on a particular topic
export async function getTopicRecommendations(req, res) {
    try {
        const topic = req.params.topic;
        const papers = await fetchTopicRecommendations(topic);
        res.status(200).json(papers);
    } catch(error) {
        res.status(500).json({ error: `Failed to fetch ${topic} recommendations`});
    }
}