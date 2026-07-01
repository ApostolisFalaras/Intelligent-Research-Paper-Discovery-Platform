import { describe, it, expect } from "vitest";
import { paperToPaperSimilarity } from "./../../../src/algorithms/paperSimilarity.js";

describe("paperToPaperSimilarity", () => {
	const paperA = {
		topic_vector: { T1: 0.95 },
		field_vector: { F1: 0.90 },
		subfield_vector: { SF1: 1 },
		domain_vector: { D1: 1 },
		author_vector: { A1: 0.92 },
		keyword_vector: { K1: 0.81 }
	};

	const paperB = {
		topic_vector: { T1: 0.87 },
		field_vector: { F1: 0.88 },
		subfield_vector: { SF1: 0.98 },
		domain_vector: { D1: 1 },
		author_vector: { A1: 0.89 },
		keyword_vector: { K1: 0.86 }
	};

	const paperC = {
		topic_vector: { T2: 0.87 },
		field_vector: { F2: 0.88 },
		subfield_vector: { SF2: 0.98 },
		domain_vector: { D2: 1 },
		author_vector: { A2: 0.89 },
		keyword_vector: { K2: 0.86 }
	}


	// ---------- PAPER SIMILARITY CALCULATION FUNCTION  ----------

	it("Returns score close to 1 for similar papers", () => {
		const score = paperToPaperSimilarity(paperA, paperB);

		expect(score).toBeCloseTo(1);
	});

	it("Returns 1 for identical papers / same paper", () => {
		const score = paperToPaperSimilarity(paperA, paperA);
		
		// Not .toBe(1) to account for floating point precision error
		expect(score).toBeCloseTo(1);
	});

	it("Returns 0 for completely different papers", () => {
		const score = paperToPaperSimilarity(paperA, paperC);

		expect(score).toBe(0);
	});

	it("returns 0 when both papers are missing", () => {
		const score = paperToPaperSimilarity(null, null);

		expect(score).toBe(0);
	});
});
