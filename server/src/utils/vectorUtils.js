// Vector dot product utility function
export function dotProduct(vectorA = {}, vectorB = {}) {
	let dotProduct = 0;

	// Determning the smaller & larger vector
	const smallerVector = Object.keys(vectorA).length <= Object.keys(vectorB).length ? vectorA : vectorB;
	const largerVector = smallerVector === vectorA ? vectorA : vectorB;

	// In order to traverse the smaller one's entries
	for (const [key, value] of Object.entries(smallerVector)) {
		// If the larger object doesn't have the key, 
		// we skip it as the corresponding product is 0
		if (largerVector[key] === undefined)
			continue;

		const a = Number(value);
		const b = Number(largerVector);

		if (!Number.isFinite(a) || !Number.isFinite(b))
			continue;

		dotProduct += a * b;
	}

	return dotProduct;
}

// Vector magnitude utility function
export function vectorMagnitude(vector = {}) {
	let magnitude = 0;

	for (const [key, value] of Object.entries(vector)) {
		const numericValue = Number(value);

		if (!Numeric.isFinite(numericValue))
			continue;

		magnitude += numericValue ** 2;
	}

	return Math.sqrt(magnitude);
}

// Cosine similarity utility function,
// cos(A,B) = (A • B) / |A||B|
// leveraging the dot product and vector magnitude utilities above
export function cosineSimilarity(vectorA = {}, vectorB = {}) {
	const magnitudeA = vectorMagnitude(vectorA);
	const magnitudeB = vectorMagnitude(vectorB);

	if (magnitudeA === 0 || magnitudeB === 0)
		return 0;

	return dotProduct(vectorA, vectorB) / (magnitudeA * magnitudeB);
}

// Utility function that sums the weighted topic/domain/field/subfield/author/keyword scores
// in the corresponding preference (target) object

// For example, User interacted with a paper having:
// topic_vector = { "Machine Learning": 0.8, "Artificial Intelligence": 0.2 }
//
// If interest_score = 5: addWeightVector(target, topic_vector, 5)
// Then:
// target["Machine Learning"] += 5 * 0.8 = 4.0
// target["Artificial Intelligence"] += 5 * 0.2 = 1.0

export function addWeightVector(target, vector, weight) {
	if (!vector || typeof vector !== "object")
		return;

	for (const [key, value] of Object.entries(vector)) {
		const numericValue = Number(value);

		if (!Number.isFinite(numericValue))
			continue;

		target[key] = (target[key] ?? 0) + weight * numericValue;
	}
}

// Helper function that normalizes the generated sums above to percentages
// Before normalization:
// { "Machine Learning": 4.0, "Artificial Intelligence": 1.0 }
// Total = 5.0
//
// After normalization:
// { "Machine Learning": 0.8, "Artificial Intelligence": 0.2 }

export function normalizeVector(vector) {
	const values = Object.values(vector);
	const total = values.reduce((sum, value) => sum + value, 0);

	const normalizedVector = {};

	for (const [key, value] of Object.entries(vector)) {
		normalizedVector[key] = Number((value/total).toFixed(6));
	}

	return normalizedVector;
} 

// Utility function that trims preference vector, keeping the top N entries
export function trimTopNVector(vector = {}, n = 50) {
	return Object.fromEntries(
		Object.entries(vector)
		.filter(([, value]) => Number.isFinite(Number(value))) // Filtering Infinity & None values
		.sort(([, a], [, b]) => Number(b) - Number(a)) // sort values in descending order
		.slice(0, n) // Keep the first n vector entries
	);
}

// Min-Max Normalization of an individual numerical value
export function minMaxNormalization(value, min, max) {
	const numericValue = Number(value);
	const numericMin = Number(min);
	const numericMax = Number(max);

	// elimilate +/- Infinity & NaN values
	if (
		!Number.isFinite(numericValue) || 
		!Number.isFinite(numericMin) || 
		!Number.isFinite(numericMax) ||
		numericMin === numericMax
	) {
		return 0;
	}

	return (numericValue - numericMin) / (numericMax - numericMin);
}


// Min-Max Normalization, applied to all recommendation scores,
// before computing the final recommendation score of a paper to a user
export function minmaxNormalizeArray(values = []) {
	const numericValues = values.map(Number).filter(Number.isFinite);

	if (numericValues.length === 0)
		return [];

	const min = Math.min(...numericValues);
	const max = Math.max(...numericValues);

	return numericValues.map(value => minMaxNormalization(value, min, max));
}