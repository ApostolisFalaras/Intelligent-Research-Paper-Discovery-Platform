import { describe, it, expect } from "vitest";
import { userToUserSimilarity } from "../../../src/algorithms/userSimilarity.js";


describe("userToUserSimilarity", () => {
	const userA = {
			topic_preferences: { T1: 0.95 },
			field_preferences: { F1: 0.90 },
			subfield_preferences: { SF1: 1 },
			domain_preferences: { D1: 1 },
			author_preferences: { A1: 0.92 },
			keyword_preferences: { K1: 0.81 }
		};
	
		const userB = {
			topic_preferences: { T1: 0.87 },
			field_preferences: { F1: 0.88 },
			subfield_preferences: { SF1: 0.98 },
			domain_preferences: { D1: 1 },
			author_preferences: { A1: 0.89 },
			keyword_preferences: { K1: 0.86 }
		};
	
		const userC = {
			topic_preferences: { T2: 0.87 },
			field_preferences: { F2: 0.88 },
			subfield_preferences: { SF2: 0.98 },
			domain_preferences: { D2: 1 },
			author_preferences: { A2: 0.89 },
			keyword_preferences: { K2: 0.86 }
		}
	
	
		// ---------- USER SIMILARITY CALCULATION FUNCTION  ----------
	
		it("Returns score close to 1 for similar papers", () => {
			const score = userToUserSimilarity(userA, userB);
	
			expect(score).toBeCloseTo(1);
		});
	
		it("Returns 1 for identical papers / same paper", () => {
			const score = userToUserSimilarity(userA, userA);
			
			// Not .toBe(1) to account for floating point precision error
			expect(score).toBeCloseTo(1);
		});
	
		it("Returns 0 for completely different papers", () => {
			const score = userToUserSimilarity(userA, userC);
	
			expect(score).toBe(0);
		});
	
		it("returns 0 when both papers are missing", () => {
			const score = userToUserSimilarity(null, null);
	
			expect(score).toBe(0);
		});

});