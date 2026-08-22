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
		// Added separate weights for paper views and paper saves, 
		// as the paper saves describe number of saves instead of a boolean flag (denoted by +5)
		const viewCount = Math.max(Number(interaction.view_count ?? 0), 0);
		const folderCount = Math.max(Number(interaction.saved_folder_count ?? 0), 0);
		
		const viewWeight = Math.log1p(viewCount);
		const saveWeight = (folderCount > 0) ? 5 + 2 * Math.log1p(folderCount) : 0;

		const weight = viewWeight + saveWeight;

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
