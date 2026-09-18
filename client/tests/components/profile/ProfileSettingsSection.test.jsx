import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import ProfileSettingsSection from "../../../src/components/profile/ProfileSettingsSection.jsx";


describe("ProfileSettingsSection", () => {

	// ---------- RENDERING TESTS ----------

	it("Displays the section title, description and children", () => {
        render(
            <ProfileSettingsSection
                title="Profile information"
                description="Manage your public profile information."
            >
                <button>Edit profile</button>
            </ProfileSettingsSection>
        );

        expect(screen.getByRole("heading", { name: "Profile information" })).toBeInTheDocument();

        expect(screen.getByText("Manage your public profile information.")).toBeInTheDocument();

        expect(screen.getByRole("button", { name: "Edit profile" })).toBeInTheDocument();
    });


	it("Does not display a description when one is not provided", () => {
        render(
            <ProfileSettingsSection title="Account">
                <span>Account settings</span>
            </ProfileSettingsSection>
        );

        expect(screen.getByRole("heading", { name: "Account" })).toBeInTheDocument();
        expect(screen.queryByText("Manage your public profile information.")).not.toBeInTheDocument();
    });


	it("Applies the danger styling when the section is dangerous", () => {
        const { container } = render(
            <ProfileSettingsSection
                title="Delete account"
                description="Permanently delete your account."
                danger
            >
                <button>Delete</button>
            </ProfileSettingsSection>
        );

        expect(container.querySelector(".settings-section")).toHaveClass("danger");

        expect(screen.getByRole("heading", { name: "Delete account" })).toHaveClass("danger");
    });
});