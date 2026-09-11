import { 
	fetchPopularityMetricRanges, 
	fetchPopularityBatch, 
	upsertPopularityScores } from "./../repositories/popularityRepository.js";

import { 
	fetchPopularityRefreshState, 
	markPopularityRefreshComplete } from "./../repositories/popularityRefreshRepository.js";

import { calculateGlobalPopularityScore } from "./../algorithms/popularityScoring.js";


const DEFAULT_BATCH_SIZE = 10000;


// Rebuild global popularity scores for all ~1M papers 
export async function rebuildGlobalPopularityScores(batchSize = DEFAULT_BATCH_SIZE) {
	
	// Fetch metric upper and lower value bounds
	const ranges = await fetchPopularityMetricRanges();

	let lastPaperId = 0;
	let updatedPapers = 0;

	while (true) {
		// Fetch current batch to be updated
		const papers = await fetchPopularityBatch(lastPaperId, batchSize);
		if (papers.length === 0) {
			break;
		}

		// Calculate new popularity scores
		const scores = papers.map((paper) => ({
			paperId: Number(paper.paper_id),
			popularityScore: calculateGlobalPopularityScore(paper, ranges)
		}));

		// And upsert them in the metrics table
		updatedPapers += await upsertPopularityScores(scores);

		lastPaperId = Number(papers[papers.length - 1].paper_id);
	}

	return updatedPapers;
}


const EVENT_THRESHOLD = 500;
const IDLE_MINUTES = 15;

// Decide whether we need to refresh the global popularity,
// based on the number of user-paper interactions since the last refresh
export async function refreshPopularityIfNeeded() {
	const state = await fetchPopularityRefreshState();

	// Fetch current pending event number
	const pendingEventCount = Number(state.pending_event_count ?? 0);
	if (pendingEventCount === 0) {
		return {
			refreshed: false,
			updatedPapers: 0
		};
	}

	// Validate event and timeout thresholds
	const reachedThreshold = pendingEventCount >= EVENT_THRESHOLD;
	
	const lastEventAt = state.last_event_at ? new Date(state.last_event_at) : null;
	const idleMillisecs = lastEventAt ? Date.now() - lastEventAt.getTime() : 0;
	const idleMinutes = idleMillisecs / (1000 * 60);

	const reachedIdleTimeout = idleMinutes >= IDLE_MINUTES;

	if (!reachedThreshold && !reachedIdleTimeout) {
		return {
			refreshed: false,
			updatedPapers: 0
		};
	}

	// Update global popularities, 
	// while keeping track of the pending event count before the update
	const processedEventCount = pendingEventCount;
	
	const updatedPapers = await rebuildGlobalPopularityScores();

	await markPopularityRefreshComplete(processedEventCount);

	return {
		refreshed: true,
		updatedPapers
	};
}