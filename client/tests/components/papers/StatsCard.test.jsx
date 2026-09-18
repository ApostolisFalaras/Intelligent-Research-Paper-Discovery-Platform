import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import StatsCard from "../../../src/components/papers/StatsCard.jsx";

describe("StatsCard", () => {

	// ---------- RENDERING TESTS ----------

	it("Displays the metric label, value and sublabel", () => {
        render(
            <StatsCard
                label="Citations"
                value={1250}
                sublabel="Total citations"
            />
        );

        expect(screen.getByText("Citations")).toBeInTheDocument();

        expect(screen.getByText((1250).toLocaleString())).toBeInTheDocument();

        expect(screen.getByText("Total citations")).toBeInTheDocument();
    });


	it("Displays non-numeric values unchanged", () => {
        render(
            <StatsCard
                label="FWCI"
                value="Top 1%"
            />
        );

        expect(screen.getByText("Top 1%")).toBeInTheDocument();
    });


	it("Does not display a sublabel when one is not provided", () => {
        render(
            <StatsCard
                label="Citations"
                value={100}
            />
        );

        expect(screen.queryByText("Total citations")).not.toBeInTheDocument();
    });

});