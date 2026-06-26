import cron from "node-cron";
import { rebuildStaleUserRecommendations } from "./../services/recommendationJobService.js";

let isRunning = false;
let scheduledTask = null;

// Define and schedule the background job
export function startRecommendationRefreshJob() {
	// If a task is already scheduled, return it
	if (scheduledTask) {
		return scheduledTask;
	}

	// Schedule the background job to run once an hour (denoted by "0")
	scheduledTask = cron.schedule("0 * * * *", async () => {
		// If it's already running, let it finish
		if (isRunning) {
			console.log("[recommendation-job] Previous execution still active, skipping");
			return;
		}

		// Start the job
		isRunning = true;
		console.log("[recommendation-job] Started");

		try {
			// Run the asynchronous recommendation update function
			const results = await rebuildStaleUserRecommendations(50);
			
			// Print result totals
			console.log("[recommendation-job] Completed.", {
				processed: results.length,
				successful: results.filter(res => res.status === "success").length,
				failed: results.filter(res => res.status === "failed").length
			});

		} catch(error) {
			console.error("[recommendation-job] Failed", error);
		} finally {
			// Finish the job
			isRunning = false;
		}
	}); 

	// Return the scheduled job's object
	console.log("[recommendation-job] Scheduled");
	return scheduledTask;
}

// Stop the background job 
export function stopRecommendationJob() {
	if (scheduledTask) {
		scheduledTask.stop();
		scheduledTask = null;
	}

	isRunning = false;
}