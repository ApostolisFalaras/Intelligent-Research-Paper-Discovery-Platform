import { cosineSimilarity } from "../utils/vectorUtils.js";
import { fetchPaperRecommendationFeatures } from "../repositories/paperSimilarityRepository.js";

// Paper-paper similarity, we compute all vector similarities (topics, fields, subfields, etc.)
// and add them through a linear combination that assigns different weight to each similarity
export function paperToPaperSimilarity(paperAFeatures, paperBFeatures) {
	if (!paperAFeatures || !paperBFeatures) {
		return 0;
	}

	const topicSimilarity = cosineSimilarity(paperAFeatures.topic_vector, paperBFeatures.topic_vector);
	const domainSimilarity = cosineSimilarity(paperAFeatures.domain_vector, paperBFeatures.domain_vector);
	const fieldSimilarity = cosineSimilarity(paperAFeatures.field_vector, paperBFeatures.field_vector);
	const subfieldSimilarity = cosineSimilarity(paperAFeatures.subfield_vector, paperBFeatures.subfield_vector);
	const authorSimilarity = cosineSimilarity(paperAFeatures.author_vector, paperBFeatures.author_vector);
	const keywordSimilarity = cosineSimilarity(paperAFeatures.keyword_vector, paperBFeatures.keyword_vector);

	const finalPaperSimilarity = 
		0.40 * topicSimilarity + 0.25 * subfieldSimilarity + 0.15 * fieldSimilarity +
		0.05 * domainSimilarity + 0.05 * authorSimilarity + 0.10 * keywordSimilarity;
		
	return finalPaperSimilarity;
}