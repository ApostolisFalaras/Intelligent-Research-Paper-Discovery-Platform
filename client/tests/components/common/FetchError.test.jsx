import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import FetchError from "../../../src/components/common/FetchError.jsx";


describe("FetchError", () => {

	// ---------- RENDERING TESTS ----------

	it("Displays the provided error message", () => {
        render(
            <FetchError
                fetchError="Could not fetch papers."
                retrySearchQuery={vi.fn()}
            />
        );

        expect(screen.getByText("Something went wrong")).toBeInTheDocument();
        expect(screen.getByText("Could not fetch papers.")).toBeInTheDocument();
    });


	it("Displays the default error message when none is provided", () => {
        render(
            <FetchError
                retrySearchQuery={vi.fn()}
            />
        );

        expect(screen.getByText("Could not load results. Check your connection and try again."))
			.toBeInTheDocument();
    });


    it("Retries the request when Try Again is clicked", async () => {
        const user = userEvent.setup();
        const retrySearchQuery = vi.fn();

        render(
            <FetchError
                fetchError="Request failed."
                retrySearchQuery={retrySearchQuery}
            />
        );

		const button = screen.getByRole("button", { name: "Try Again" });
        await user.click(button);

        expect(retrySearchQuery).toHaveBeenCalledTimes(1);
    });
});