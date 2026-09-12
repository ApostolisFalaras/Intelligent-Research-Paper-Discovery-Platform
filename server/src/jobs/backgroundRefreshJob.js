import cron from "node-cron";
import { rebuildStaleUserRecommendations } from "./../services/recommendationJobService.js";
import { refreshPopularityIfNeeded } from "./../services/popularityService.js";

let isRunning = false;
let scheduledTask = null;
let tick = 0;


// Define and schedule the background job
export function startBackgroundRefreshJob() {
	// If a task is already scheduled, return it
	if (scheduledTask) {
		return scheduledTask;
	}

	// Schedule the background job to run once per 30min (denoted by "/30")
	scheduledTask = cron.schedule("*/30 * * * *", async () => {
		// If it's already running, let it finish
		if (isRunning) {
			console.log("[background-job] Previous execution still active, skipping");
			return;
		}

		// Start the job
		isRunning = true;
		tick += 1;

		console.log(`[background-job] Started tick ${tick}`);

		try {
			// Always check if popularity needs to be refresh first,
			// so that if a refresh is needed, it completes before the recommendation refresh
			const popularityResult = await refreshPopularityIfNeeded();

			console.log("[background-job] Popularity check:", popularityResult);

			if (tick % 2 === 0) {
				// Run the asynchronous recommendation update function
				const results = await rebuildStaleUserRecommendations(50);
				
				// Print result totals
				console.log("[background-job] Recommendations Completed.", {
					processed: results.length,
					successful: results.filter(res => res.status === "success").length,
					failed: results.filter(res => res.status === "failed").length
				});
			}
			

		} catch(error) {
			// If popularity refresh fails, recommendation rebuilding for this tick is also skipped.
			// That's desirable because recommendation candidate selection depends on global popularity.
			console.error("[background-job] Failed", error);

		} finally {
			// Finish the job
			isRunning = false;
		}
	}); 

	// Return the scheduled job's object
	console.log("[background-job] Scheduled");
	return scheduledTask;
}

// Stop the background job 
export function stopRecommendationJob() {
	if (scheduledTask) {
		scheduledTask.stop();
		scheduledTask = null;
	}

	isRunning = false;
	tick = 0;
}