import { useState, useEffect, useCallback } from "react";

let cachedTopics = null;
let pendingTopicsRequest = null;

/* Make a request to the server API  to fetch all topics */
async function requestTopics() {
	const response = await fetch("/api/topics/all");

	// Testing response status first
	if (!response.ok) {
		let message = "Unable to fetch topics.";

		try {
			const result = await response.json();
			message = result.message || message;
		} catch {
			// Ignore parsing errors and keep the generic message.
		}

		throw new Error(message);
	}

	let result;

	try {
		result = await response.json();
	} catch {
		throw new Error("The topics response was not valid JSON.");
	}

	const topics = result.data ?? [];

	if (!Array.isArray(topics)) {
		throw new Error("The server returned invalid input list.");
	}

	return topics;
}

/* Helper function that checks if a request is already underway before calling the backend API */
function getTopics() {
	if (cachedTopics) {
		return Promise.resolve(cachedTopics);
	}

	// Checking if request is still being processed and not sending a new one if it is
	if (pendingTopicsRequest) {
		return pendingTopicsRequest;
	}

	pendingTopicsRequest = requestTopics();

	// Mark request's completion
	pendingTopicsRequest.finally(() => {
		pendingTopicsRequest = null;
	});

	return pendingTopicsRequest;
}

export function useTopics() {
	const [topics, setTopics] = useState(() => cachedTopics ?? []);
	const [loading, setLoading] = useState(() => cachedTopics === null);
	const [error, setError] = useState(null);

	const loadTopics = useCallback(async ({ force = false } = {}) => {
		if (force) {
			cachedTopics = null;
			pendingTopicsRequest = null;
		}

		setLoading(true);
		setError(null);

		try {
			const fetchedTopics = await getTopics();

			cachedTopics = fetchedTopics;

			setTopics(fetchedTopics);

			return fetchedTopics;
		}
		catch (error) {
			const normalizedError =
				error instanceof Error ? error : new Error("Unable to fetch topics.");

			setError(normalizedError);
		}
		finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		let cancelled = false;

		async function initializeTopics() {
			setLoading(true);
			setError(null);

			try {
				const fetchedTopics = await getTopics();

				cachedTopics = fetchedTopics;

				if (!cancelled) {
					setTopics(fetchedTopics);
				}
			}
			catch (error) {
				if (!cancelled) {
					setError( error instanceof Error ? error : new Error("Unable to fetch topics."));
				}
			}
			finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		}

		initializeTopics();

		return () => {
			cancelled = true;
		};
	}, []);

	return {
		topics,
		loading,
		error,
		refresh: () => loadTopics({force: true})
	}
}