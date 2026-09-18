import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import OABadge from "../../../src/components/papers/OABadge.jsx";


describe("OABadge", () => {

	// ---------- RENDERING TESTS ----------

	it("Displays the correct label for gold access", () => {
		render(<OABadge status="gold" />);

		expect(screen.getByText("Gold OA")).toBeInTheDocument();
	});


	it("Displays the correct label for green access", () => {
		render(<OABadge status="green" />);

		expect(screen.getByText("Green OA")).toBeInTheDocument();
	});


	it("Displays the correct label for diamond access", () => {
		render(<OABadge status="diamond" />);

		expect(screen.getByText("Diamond OA")).toBeInTheDocument();
	});


	it("Displays the correct label for hybrid access", () => {
		render(<OABadge status="hybrid" />);

		expect(screen.getByText("Hybrid OA")).toBeInTheDocument();
	});

	it("Displays the correct label for bronze access", () => {
		render(<OABadge status="bronze" />);

		expect(screen.getByText("Bronze OA")).toBeInTheDocument();
	});
            
	it("Displays the correct label for closed access", () => {
		render(<OABadge status="closed" />);

		expect(screen.getByText("Closed")).toBeInTheDocument();
	});


	it("Falls back to Closed for an unknown status", () => {
        render(<OABadge status="unknown" />);

        expect(screen.getByText("Closed")).toBeInTheDocument();
    });
});