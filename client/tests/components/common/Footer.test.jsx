import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import Footer from "../../../src/components/common/Footer.jsx";

vi.mock("../../../src/components/common/AppLabel.jsx", () => ({
	default: () => (
		<div data-testid="app-label">
			Scholaris
		</div>
	)
}));


describe("Footer", () => {

	// ---------- RENDERING TESTS ----------

	it("Renders the footer on the home page", () => {
        render(
			<MemoryRouter initialEntries={["/"]}>
				<Footer />
			</MemoryRouter>
		);

        expect(screen.getByTestId("app-label")).toBeInTheDocument();

        expect(screen.getByText("© Scholaris Research Intelligence · Built for the curious"))
			.toBeInTheDocument();
    });


    it("Does not render the footer outside the home page", () => {
        render(
			<MemoryRouter initialEntries={["/search"]}>
				<Footer />
			</MemoryRouter>
		);

        expect(screen.queryByText("© Scholaris Research Intelligence · Built for the curious"))
			.not.toBeInTheDocument();

        expect(screen.queryByTestId("app-label")).not.toBeInTheDocument();
    });
});