import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../src/repositories/recommendationProfileRepository.js", () => ({
	fetchUserInteractionRows: vi.fn(),
	upsertUserProfilePreferences: vi.fn()
}));

vi.mock("../../../src/algorithms/userProfileAggregation.js", () => ({
    buildProfilePreferences: vi.fn()
}));


import { 
	fetchUserInteractionRows, 
	upsertUserProfilePreferences 
} from "../../../src/repositories/recommendationProfileRepository.js";
import { rebuildUserProfilePreferences } from "../../../src/services/recommendationProfileService.js";
import { buildProfilePreferences } from "../../../src/algorithms/userProfileAggregation.js";

// A simple interaction ommitting the rest of the interaction fields retrieved
const interactionRows = [
	{
		paper_id: 101,
		interest_score: 8,
		topic_vector: { T101: 0.65, T205: 0.35 },
		field_vector: { F10: 1.0 },
		subfield_vector: { SF101: 0.70, SF102: 0.30 },
		domain_vector: { D1: 1.0 },
		author_vector: { A123: 0.60, A456: 0.40 },
		keyword_vector: { "machine learning": 0.50, "deep learning": 0.30, "computer vision": 0.20 }
	},
	{
		paper_id: 202,
		interest_score: 5,
		topic_vector: { T101: 0.40, T310: 0.60 },
		field_vector: { F10: 1.0 },
		subfield_vector: { SF101: 0.25, SF205: 0.75 },
		domain_vector: { D1: 1.0 },
		author_vector: { A456: 0.50, A789: 0.50 },
		keyword_vector: { "deep learning": 0.50, "transformers": 0.30, "nlp": 0.20 }
	},
	{
		paper_id: 303,
		interest_score: 2,
		topic_vector: { T205: 1.0 },
		field_vector: { F20: 1.0 },
		subfield_vector: { SF301: 1.0 },
		domain_vector: { D2: 1.0 },
		author_vector: { A999: 1.0 },
		keyword_vector: { "bioinformatics": 0.60, "genomics": 0.40 }
	}
];
// The simplest possible user profile
const userProfile = {
	topicPreferences: { T101: 0.48, T205: 0.24, T310: 0.20, T999: 0.08 },
	fieldPreferences: { F10: 0.87, F20: 0.13 },
	subfieldPreferences: { SF101: 0.44, SF205: 0.28, SF102: 0.19, SF301: 0.09 },
	domainPreferences: { D1: 0.87, D2: 0.13 },
	authorPreferences: { A456: 0.33, A123: 0.29, A789: 0.22, A999: 0.16 },
	keywordPreferences: { 
		"deep learning": 0.30, "machine learning": 0.22, "computer vision": 0.14,
		"transformers": 0.13, "nlp": 0.08, "bioinformatics": 0.08, "genomics": 0.05
	}
};

const savedUserProfile = {
	user_id: 42,
	topic_preferences: { T101: 0.48, T205: 0.24, T310: 0.20, T999: 0.08 },
	field_preferences: { F10: 0.87, F20: 0.13 },
	subfield_preferences: { SF101: 0.44, SF205: 0.28, SF102: 0.19, SF301: 0.09 },
	domain_preferences: { D1: 0.87, D2: 0.13 },
	author_preferences: { A456: 0.33, A123: 0.29, A789: 0.22, A999: 0.16 },
	keyword_preferences: { 
		"deep learning": 0.30, "machine learning": 0.22, "computer vision": 0.14,
		"transformers": 0.13, "nlp": 0.08, "bioinformatics": 0.08, "genomics": 0.05
	}
};



describe("rebuildUserProfilePreferences", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	// ---------- SUCCESSFUL USER PROFILE UPDATE ----------
	
	it("Rebuilds and stores user preferences", async () => {
		fetchUserInteractionRows.mockResolvedValue(interactionRows);
		buildProfilePreferences.mockReturnValue(userProfile);
		upsertUserProfilePreferences.mockResolvedValue(savedUserProfile);

		const result = await rebuildUserProfilePreferences(42);
		
		expect(fetchUserInteractionRows).toHaveBeenCalledWith(42);
		expect(fetchUserInteractionRows).toHaveBeenCalledTimes(1);
		
		expect(buildProfilePreferences).toHaveBeenCalledWith(interactionRows);
		expect(buildProfilePreferences).toHaveBeenCalledTimes(1);

		expect(upsertUserProfilePreferences).toHaveBeenCalledWith(42, userProfile);
		expect(upsertUserProfilePreferences).toHaveBeenCalledTimes(1);
		expect(result).toEqual(savedUserProfile);
	});

	// ---------- NO USER INTERACTIONS ERROR ----------

	it("Throws 400 when the user has no interactions", async () => {
        fetchUserInteractionRows.mockResolvedValue([]);

        await expect(rebuildUserProfilePreferences(42))
            .rejects
            .toThrow("User has no interactions to build profile preferences");

        expect(buildProfilePreferences).not.toHaveBeenCalled();
        expect(upsertUserProfilePreferences).not.toHaveBeenCalled();
    });

	// ---------- DB ERROR ----------

    it("Propagates repository errors", async () => {
        fetchUserInteractionRows.mockRejectedValue(new Error("Unexpected DB error"));

        await expect(rebuildUserProfilePreferences(42))
            .rejects
            .toThrow("Unexpected DB error");

        expect(buildProfilePreferences).not.toHaveBeenCalled();
        expect(upsertUserProfilePreferences).not.toHaveBeenCalled();
    });
});