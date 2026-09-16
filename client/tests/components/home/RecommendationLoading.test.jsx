import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import RecommendationLoading from "../../../src/components/home/RecommendationLoading.jsx";


describe("RecommendationLoading", () => {

	// ---------- RENDERING TESTS ----------

	it("Shows the recommendation loading message", () => {
        render(<RecommendationLoading />);

        expect(screen.getByText("Preparing your recommendations")).toBeInTheDocument();

        expect(screen.getByText(/We're building personalized recommendations/)).toBeInTheDocument();
    });
});