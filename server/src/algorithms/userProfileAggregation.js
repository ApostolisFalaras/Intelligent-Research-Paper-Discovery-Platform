import { addWeightVector, normalizeVector, trimTopNVector } from "./../utils/vectorUtils.js";

// Algorithm function constructing each type of user preferences
export function buildProfilePreferences(interactionFeatures) {
	const topicPreferences = {};
	const domainPreferences = {};
	const fieldPreferences = {};
	const subfieldPreferences = {};
	const authorPreferences = {};
	const keywordPreferences = {};

	for (const interaction of interactionFeatures) {
		// Interest score captures the interaction's weight
		const weight = Math.max(Number(interaction.interest_score ?? 0), 0);

		addWeightVector(topicPreferences, interaction.topic_vector, weight);
		addWeightVector(domainPreferences, interaction.domain_vector, weight);
		addWeightVector(fieldPreferences, interaction.field_vector, weight);
		addWeightVector(subfieldPreferences, interaction.subfield_vector, weight);
		addWeightVector(authorPreferences, interaction.author_vector, weight);
		addWeightVector(keywordPreferences, interaction.keyword_vector, weight);
	}

	return {
		topicPreferences: normalizeVector(trimTopNVector(topicPreferences, 50)),
		domainPreferences: normalizeVector(trimTopNVector(domainPreferences, 20)),
		fieldPreferences: normalizeVector(trimTopNVector(fieldPreferences, 30)),
		subfieldPreferences: normalizeVector(trimTopNVector(subfieldPreferences, 50)),
		authorPreferences: normalizeVector(trimTopNVector(authorPreferences, 100)),
		keywordPreferences: normalizeVector(trimTopNVector(keywordPreferences, 100))
	}
}
