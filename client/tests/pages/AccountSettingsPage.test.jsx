import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import AccountSettingsPage from "../../src/AccountSettingsPage.jsx";


// Mocking modules and inner elements
const mockUseAuth = vi.fn();
const mockUpdateUser = vi.fn();

vi.mock("../../src/hooks/useAuth.jsx", () => ({
	useAuth: () => mockUseAuth()
}));

vi.mock("../../src/components/profile/SaveButton.jsx", () => ({
	default: ({ onClick, saved, loading }) => (
		<button type="button" onClick={onClick} disabled={loading}>
			{saved 
				? "Saved" 
				: loading
					? "Saving..."
					: "Save changes"
			}
		</button>
	)
}));

vi.mock("../../src/components/auth/TextInput.jsx", () => ({
	default: ({ value, onChange, placeholder, type = "text" }) => (
		<input 
			type={type}
			value={value}
			placeholder={placeholder}
			onChange={(event) => onChange(event.target.value)}
		/>
	)
}));

vi.mock("../../src/components/auth/PasswordInput.jsx", () => ({
	default: ({ value, onChange, placeholder }) => (
		<input
			type="password"
			value={value}
			placeholder={placeholder}
			onChange={(event) => onChange(event.target.value)}
		/>
	)
}));

vi.mock("../../src/components/auth/Field.jsx", () => ({
    default: ({ label, children, error, hint }) => (
        <div>
            <span>{label}</span>
            {children}
            {hint && <span>{hint}</span>}
            {error && <span>{error}</span>}
        </div>
    )
}));

vi.mock("../../src/components/profile/DeleteModal.jsx", () => ({
    default: ({ onClose, onDelete, profileInfo }) => (
        <div data-testid="delete-modal">
            <span>
                {profileInfo?.totalSavedPapers ?? 0} saved papers
            </span>

            <button type="button" onClick={onClose}>
                Close modal
            </button>

            <button type="button" onClick={onDelete}>
                Confirm delete
            </button>
        </div>
    )
}));

// Mock data
const mockUser = {
    userId: 123,
    firstName: "John",
    lastName: "Doe",
    bio: "Machine learning researcher",
    affiliation: "MIT",
    location: "Boston",
    role: "Research Scientist",
    email: "john@example.com",
    username: "johndoe",
    avatarURL: null,
    createdAt: "2025-01-10",
    lastLoginAt: "2026-09-18"
};

const mockProfileInfo = {
    totalSavedPapers: 24,
    totalFolders: 5,
    authorsFollowed: [
        { id: "A1" },
        { id: "A2" }
    ]
};


describe("AccountSettingsPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		global.fetch = vi.fn();

		mockUseAuth.mockReturnValue({
			user: mockUser,
			authLoading: false,
			updateUser: mockUpdateUser
		});
	});


	// ---------- AUTHENTICATION TESTS ----------

	it("Displays the loading state while authentication is loading", () => {
        mockUseAuth.mockReturnValue({
            user: null,
            authLoading: true,
            updateUser: mockUpdateUser
        });

        render(
			<MemoryRouter>
				<AccountSettingsPage />
			</MemoryRouter>
		);

        expect(
            screen.getByText("Loading profile...")
        ).toBeInTheDocument();

        expect(global.fetch).not.toHaveBeenCalled();
    });


    it("Renders nothing when there is no authenticated user", () => {
        mockUseAuth.mockReturnValue({
            user: null,
            authLoading: false,
            updateUser: mockUpdateUser
        });

        const { container } = render(
			<MemoryRouter>
				<AccountSettingsPage />
			</MemoryRouter>
		);

        expect(container).toBeEmptyDOMElement();
        expect(global.fetch).not.toHaveBeenCalled();
    });


	// ---------- INITIAL PROFILE RENDERING TESTS ----------

	it("Displays the public profile section by default", async () => {
        global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockProfileInfo
			})
		});

        render(
			<MemoryRouter>
				<AccountSettingsPage />
			</MemoryRouter>
		);

        expect(screen.getByRole("heading", { name: "Account Settings" })).toBeInTheDocument();

        expect(screen.getByRole("heading", { name: "Public profile" })).toBeInTheDocument();

        expect(screen.getByDisplayValue("John")).toBeInTheDocument();

        expect(screen.getByDisplayValue("Doe")).toBeInTheDocument();

        expect(screen.getByDisplayValue("Machine learning researcher")).toBeInTheDocument();
    });


	 it("Fetches profile statistics after authentication", async () => {
        global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockProfileInfo
			})
		});

        render(
			<MemoryRouter>
				<AccountSettingsPage />
			</MemoryRouter>
		);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                "/api/users/me/profile",
                {
                    credentials: "include",
                    cache: "no-store"
                }
            );
        });
    });


	it("Displays user initials when no avatar exists", () => {
        global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockProfileInfo
			})
		});

        render(
			<MemoryRouter>
				<AccountSettingsPage />
			</MemoryRouter>
		);

        expect(screen.getByText("JD")).toBeInTheDocument();

        expect(screen.getByRole("button", { name: "Upload photo" })).toBeInTheDocument();
    });


	it("Displays the avatar and photo controls when an avatar exists", () => {
        mockUseAuth.mockReturnValue({
            user: {
                ...mockUser,
                avatarURL: "/uploads/avatar.jpg"
            },
            authLoading: false,
            updateUser: mockUpdateUser
        });

        global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockProfileInfo
			})
		});

        render(
			<MemoryRouter>
				<AccountSettingsPage />
			</MemoryRouter>
		);

        expect(screen.getByRole("img", { name: "Profile Image" }))
			.toHaveAttribute("src", "/uploads/avatar.jpg");

        expect(screen.getByRole("button", { name: "Change photo" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Remove photo" })).toBeInTheDocument();
    });


	// ---------- NAVIGATION SECTION TESTS ----------

	it("Switches to the Account section", async () => {
        const user = userEvent.setup();

        global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockProfileInfo
			})
		});

        render(
			<MemoryRouter>
				<AccountSettingsPage />
			</MemoryRouter>
		);

        await user.click(screen.getByRole("button", { name: "Account" }));

        expect(screen.getByRole("heading", { name: "Account" })).toBeInTheDocument();

        expect(screen.getByDisplayValue("john@example.com")).toBeInTheDocument();

        expect(screen.getByDisplayValue("johndoe")).toBeInTheDocument();
    });


    it("Switches to the Password section", async () => {
        const user = userEvent.setup();

        global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockProfileInfo
			})
		});

        render(
			<MemoryRouter>
				<AccountSettingsPage />
			</MemoryRouter>
		);

        await user.click(screen.getByRole("button", { name: "Password" }));

        expect(screen.getByRole("heading", { name: "Change password" })).toBeInTheDocument();
    });


    it("Switches to the Danger zone section", async () => {
        const user = userEvent.setup();

        global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockProfileInfo
			})
		});

        render(
			<MemoryRouter>
				<AccountSettingsPage />
			</MemoryRouter>
		);

        await user.click(screen.getByRole("button", { name: "Danger zone" }));

        expect(screen.getByRole("heading", { name: "Danger zone" })).toBeInTheDocument();

        expect(screen.getByText("Delete this account")).toBeInTheDocument();
    });


	// ---------- PROFILE UPDATES TESTS ----------

	it("Sends the updated public profile information", async () => {
        const user = userEvent.setup();

        global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockProfileInfo
			})
		});

        global.fetch.mockResolvedValueOnce({
            ok: true,
            status: 200
        });

        render(
			<MemoryRouter>
				<AccountSettingsPage />
			</MemoryRouter>
		);

        const firstName = screen.getByDisplayValue("John");

        await user.clear(firstName);
        await user.type(firstName, "Jane");

        await user.click(screen.getByRole("button", { name: "Save changes" }));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                "/api/users/me/profile",
                expect.objectContaining({
                    method: "PATCH",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        firstName: "Jane",
                        lastName: "Doe",
                        bio: "Machine learning researcher",
                        affiliation: "MIT",
                        location: "Boston",
                        role: "Research Scientist"
                    })
                })
            );
        });

        expect(await screen.findByRole("button", { name: "Saved" })).toBeInTheDocument();
    });


	// ---------- AVATAR TESTS ----------

	it("Uploads a valid avatar and updates the authenticated user", async () => {
        const user = userEvent.setup();

        global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockProfileInfo
			})
		});

        global.fetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValue({
                data: {
                    avatarURL: "/uploads/new-avatar.png"
                }
            })
        });

        const { container } = render(
			<MemoryRouter>
				<AccountSettingsPage />
			</MemoryRouter>
		);

        const input = container.querySelector('input[type="file"]');

        const file = new File(
            ["avatar"],
            "avatar.png",
            { type: "image/png" }
        );

        await user.upload(input, file);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                "/api/users/me/profile/avatar",
                expect.objectContaining({
                    method: "POST",
                    credentials: "include",
                    body: expect.any(FormData)
                })
            );
        });

        expect(mockUpdateUser).toHaveBeenCalledWith({ avatarURL: "/uploads/new-avatar.png" });
    });


	it("Rejects unsupported avatar file types", async () => {
        const user = userEvent.setup({
			applyAccept: false
		});

        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        global.fetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValue({
                data: {
                    avatarURL: "/uploads/new-avatar.png"
                }
            })
        });

        const { container } = render(
			<MemoryRouter>
				<AccountSettingsPage />
			</MemoryRouter>
		);

        const input = container.querySelector('input[type="file"]');

        const file = new File(
            ["avatar"],
            "avatar.gif",
            { type: "image/gif" }
        );

        await user.upload(input, file, { applyAccept: false });

        expect(consoleSpy).toHaveBeenCalledWith("Only JPG and PNG files are accepted.");

        // Only the initial profile-info request should exist.
        expect(global.fetch).toHaveBeenCalledTimes(1);

        consoleSpy.mockRestore();
    });


	it("Removes the current avatar", async () => {
        const user = userEvent.setup();

        mockUseAuth.mockReturnValue({
            user: {
                ...mockUser,
                avatarURL: "/uploads/avatar.jpg"
            },
            authLoading: false,
            updateUser: mockUpdateUser
        });

        global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockProfileInfo
			})
		});

        global.fetch.mockResolvedValueOnce({
            ok: true,
            status: 200
        });

        render(
			<MemoryRouter>
				<AccountSettingsPage />
			</MemoryRouter>
		);

        await user.click(screen.getByRole("button", { name: "Remove photo" }));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                "/api/users/me/profile/avatar",
                {
                    method: "DELETE",
                    credentials: "include"
                }
            );
        });

        expect(mockUpdateUser).toHaveBeenCalledWith({ avatarURL: null });
    });


	// ---------- ACCOUNT TESTS ----------

	it("Sends updated email and username", async () => {
        const user = userEvent.setup();

        global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockProfileInfo
			})
		});

        global.fetch.mockResolvedValueOnce({
            ok: true,
            status: 200
        });

        render(
			<MemoryRouter>
				<AccountSettingsPage />
			</MemoryRouter>
		);

        await user.click(screen.getByRole("button", { name: "Account" }));

        const email = screen.getByDisplayValue("john@example.com");
        const username = screen.getByDisplayValue("johndoe");

        await user.clear(email);
        await user.type(email, "jane@example.com");

        await user.clear(username);
        await user.type(username, "janedoe");

        await user.click(screen.getByRole("button", { name: "Save changes" }));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                "/api/users/me/profile",
                expect.objectContaining({
                    method: "PATCH",
                    body: JSON.stringify({
                        email: "jane@example.com",
                        username: "janedoe"
                    })
                })
            );
        });
    });


	  it("Displays validation errors for an invalid email and username", async () => {
        const user = userEvent.setup();

        global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockProfileInfo
			})
		});

        render(
			<MemoryRouter>
				<AccountSettingsPage />
			</MemoryRouter>
		);

        await user.click(screen.getByRole("button", { name: "Account" }));

        const email = screen.getByDisplayValue("john@example.com");
        const username = screen.getByDisplayValue("johndoe");

        await user.clear(email);
        await user.type(email, "invalid-email");

        await user.clear(username);
        await user.type(username, "a");

        await user.click(screen.getByRole("button", { name: "Save changes" }));

        expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();

        expect(screen.getByText("3–20 characters, letters, numbers, and underscores only."))
			.toBeInTheDocument();
    });


	// ---------- PASSWORD TESTS ----------

	it("Displays password strength after entering a new password", async () => {
        const user = userEvent.setup();

        global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockProfileInfo
			})
		});

        render(
			<MemoryRouter>
				<AccountSettingsPage />
			</MemoryRouter>
		);

        await user.click(screen.getByRole("button", { name: "Password" }));

        await user.type(screen.getByPlaceholderText("At least 8 characters"), "Password123!");

        expect(screen.getByText("Strong")).toBeInTheDocument();
    });


    it("Displays when the new passwords match", async () => {
        const user = userEvent.setup();

        global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockProfileInfo
			})
		});

        render(
			<MemoryRouter>
				<AccountSettingsPage />
			</MemoryRouter>
		);

        await user.click(screen.getByRole("button", { name: "Password" }));

        await user.type(screen.getByPlaceholderText("At least 8 characters"), "Password123!");

        await user.type(screen.getByPlaceholderText("Confirm your password"), "Password123!");

        expect(screen.getByText("Passwords match")).toBeInTheDocument();
    });


    it("Displays when the new passwords do not match", async () => {
        const user = userEvent.setup();

        global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockProfileInfo
			})
		});

        render(
			<MemoryRouter>
				<AccountSettingsPage />
			</MemoryRouter>
		);

        await user.click(screen.getByRole("button", { name: "Password" }));

        await user.type(screen.getByPlaceholderText("At least 8 characters"), "Password123!");

        await user.type(screen.getByPlaceholderText("Confirm your password"), "DifferentPassword!");

        expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
    });


	it("Sends the new password when password validation succeeds", async () => {
        const user = userEvent.setup();

        global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockProfileInfo
			})
		});

        global.fetch.mockResolvedValueOnce({
            ok: true,
            status: 200
        });

        render(
			<MemoryRouter>
				<AccountSettingsPage />
			</MemoryRouter>
		);

        await user.click(screen.getByRole("button", { name: "Password" }));

        await user.type(screen.getByPlaceholderText("Your current password"), "OldPassword123!");

        await user.type(screen.getByPlaceholderText("At least 8 characters"), "NewPassword123!");

        await user.type(screen.getByPlaceholderText("Confirm your password"), "NewPassword123!");

        await user.click(screen.getByRole("button", { name: "Save changes" }));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                "/api/users/me/profile",
                expect.objectContaining({
                    method: "PATCH",
                    body: JSON.stringify({
                        password: "NewPassword123!"
                    })
                })
            );
        });
    });


	// ---------- DELETE ACCOUNT TESTS ----------

	it("Opens and closes the delete-account modal", async () => {
        const user = userEvent.setup();

        global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockProfileInfo
			})
		});

        render(
			<MemoryRouter>
				<AccountSettingsPage />
			</MemoryRouter>
		);

        await user.click(screen.getByRole("button", { name: "Danger zone" }));

        await user.click(screen.getByRole("button", { name: "Delete account" }));

        expect(screen.getByTestId("delete-modal")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Close modal" }));

        expect(screen.queryByTestId("delete-modal")).not.toBeInTheDocument();
    });


	it("Deletes the authenticated user's account", async () => {
        const user = userEvent.setup();

        global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockProfileInfo
			})
		});

        global.fetch.mockResolvedValueOnce({
            ok: true,
            status: 200
        });

        render(
			<MemoryRouter>
				<AccountSettingsPage />
			</MemoryRouter>
		);

        await user.click(screen.getByRole("button", { name: "Danger zone" }));

        await user.click(screen.getByRole("button", { name: "Delete account" }));

        await user.click(screen.getByRole("button", { name: "Confirm delete" }));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                "/api/users/me/profile",
                {
                    method: "DELETE",
                    credentials: "include"
                }
            );
        });
    });
});