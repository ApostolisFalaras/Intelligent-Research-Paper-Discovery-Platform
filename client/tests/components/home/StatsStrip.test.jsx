import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import StatsStrip from "../../../src/components/home/StatsStrip.jsx";

describe("StatsStrip", () => {

	// ---------- RENDERING TESTS ----------

	it("Renders all application statistics", () => {
        render(<StatsStrip />);

        expect(screen.getByText("Papers Indexed")).toBeInTheDocument();
        expect(screen.getByText("Authors")).toBeInTheDocument();
        expect(screen.getByText("Scientific Topics")).toBeInTheDocument();
        expect(screen.getByText("Open Access")).toBeInTheDocument();
        expect(screen.getAllByText("1M+")).toHaveLength(2);
        expect(screen.getByText("4.5K+")).toBeInTheDocument();
        expect(screen.getByText("40%")).toBeInTheDocument();
    });
});