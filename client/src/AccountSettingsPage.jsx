import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, User, Lock, Trash2, Check, X } from "lucide-react";
import ProfileSettingsSection from "./components/profile/ProfileSettingsSection.jsx";
import SaveButton from "./components/profile/SaveButton.jsx";
import Field from "./components/auth/Field.jsx";
import TextInput from "./components/auth/TextInput.jsx";
import PasswordInput from "./components/auth/PasswordInput.jsx";
import DeleteModal from "./components/profile/DeleteModal.jsx";
import { useAuth } from "./hooks/useAuth.jsx";
import "./styles/account-settings.css"


// Settings section
const SECTIONS = [
    { id: "profile", label: "Public profile", icon: <User size={14} /> },
    { id: "account", label: "Account", icon: <Lock size={14} /> },
    { id: "password", label: "Password", icon: <Lock size={14} /> },
    { id: "danger", label: "Danger zone", icon: <Trash2 size={14} /> }
];

// Available roles for a user
const userRoles = [
	"PhD Student",
	"Postdoctoral Research",
	"Assistant Professor",
	"Associate Professor",
	"Full Professor",
	"Research Scientist",
	"Industry Researcher",
	"Independent Researcher",
	"Undergraduate Student",
	"Master's Student",
];


// Estimate password strength using heuristic scoring conditions,
// based on the password length, and existence of letters, ditigs, and other special characters
function passwordStrength(password) {
    let score = 0;
    if (password.length > 8) score++;
    if (password.length > 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if(/[0-9]/.test(password)) score++;
    if(/[^a-zA-Z0-9]/.test(password)) score++;

    // "type" is assigned as a class in the strength-bar elements
    if (score === 1)
        return { label: "Weak", type: "weak" }
    else if (score === 2)
        return { label: "Fair", type: "fair" }
    else if (score === 3)
        return { label: "Good", type: "good" }
    else if (score === 4)
        return { label: "Strong", type: "strong" }
    else 
        return { label: "Very Strong", type: "very-strong" }
} 

// Validate username & email structure
function validateUsername(username) {
    return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


function AccountSettingsPage() {
    const { user, authLoading, updateUser } = useAuth();
    const [profileInfo, setProfileInfo] = useState(null);

    // Active tab state
    const [activeSection, setActiveSection] = useState("profile");

    // Avatar URL
    const fileInputRef = useRef(null);

    // Profile tab state
    const [profile, setProfile] = useState({
        firstName: "",
        lastName: "",
        bio: "",
        affiliation: "",
        location: "",
        role: "",
    });
    const [profileSaved, setProfileSaved] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);

    // Account tab state
    const [account, setAccount] = useState({
        email: "",
        username: ""
    });
    const [accountSaved, setAccountSaved] = useState(false);
    const [accountLoading, setAccountLoading] = useState(false);
    const [accountErrors, setAccountErrors] = useState({
        email: "",
        username: ""
    });

    // Profile tab state
    const [passwords, setPasswords] = useState({
        current: "",
        next: "",
        confirm: ""
    });
    const [passwordSaved, setPasswordSaved] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState({
        next: "",
        confirm: ""
    });

    // State flag for the appearance of the delete modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        if (authLoading || !user) {
            return;
        }

        setProfile({
            firstName: user.firstName ?? "",
            lastName: user.lastName ?? "",
            bio: user.bio ?? "",
            affiliation: user.affiliation ?? "",
            location: user.location ?? "",
            role: user.role ?? ""
        });

        setAccount({
            email: user.email ?? "",
            username: user.username ?? ""
        });

    }, [user]);


    // Don't load user profile statistics until user is authenticated
	useEffect(() => {
		if (authLoading || !user) {
			return;
		}

		// Fetches profile info: activity totals, recent activity, top folders, recent followed authors
		async function fetchProfileInfo() {
			try {

				const response = await fetch("/api/users/me/profile", {
					credentials: "include",
					cache: "no-store",
				});

				if (!response.ok) {
					throw new Error(`Request failed with status ${response.status}`);
				}

				const result = await response.json();
				setProfileInfo(result.data ?? null);
			}
			catch (error) {
				console.error("Failed to fetch profile info:", error);
				setProfileInfo(null);
			}
		}

		fetchProfileInfo();

	}, [authLoading, user?.userId]);
		

    // Validate avatar file's type and size
    async function handleAvatarSelect(event) {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        const allowedTypes = ["image/jpeg", "image/png"];

        if (!allowedTypes.includes(file.type)) {
            console.error("Only JPG and PNG files are accepted.");
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            console.error("Image must be smaller than 10MB.");
            return;
        }

        const formData = new FormData();
        formData.append("avatar", file);

        try {
            const response = await fetch("/api/users/me/profile/avatar", 
                {
                    method: "POST",
                    credentials: "include",
                    body: formData
                }
            );

            if (!response.ok) {
                throw new Error(`Upload failed with status ${response.status}`);
            }

            const result = await response.json();

            updateUser({ avatarURL: result.data.avatarURL });

        } catch (error) {
            console.error("Failed to upload avatar:", error);
        }
    }

    async function handleAvatarRemove() {
        try {
            const response = await fetch("/api/users/me/profile/avatar", {
                method: "DELETE",
                credentials: "include"
            });

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }

            updateUser({ avatarURL: null });

        } catch (error) {
            console.error("Failed to remove profile avatar:", error);
        }
    }


    // Save updated profile information
    async function handleProfileSubmit(event) {
        event.stopPropagation();

        setProfileLoading(true);
        setProfileSaved(false);
        
        try {
            const response = await fetch("/api/users/me/profile", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                    bio: profile.bio,
                    affiliation: profile.affiliation,
                    location: profile.location,
                    role: profile.role,
                })
            });

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }

        } catch (error) {
            console.error("Failed to update profile info:", error);
        }

        setProfileLoading(false);
        setProfileSaved(true);
    }

    // Save updated account information
    async function handleAccountSubmit(event) {
        event.stopPropagation();

        // Validate email and username
        const errors = {};

        if (!validateEmail(account.email)) 
            errors.email = "Enter a valid email address.";

        if (!validateUsername(account.username))
            errors.username = "3–20 characters, letters, numbers, and underscores only.";

        setAccountErrors(errors);


        setAccountLoading(true);
        setAccountSaved(false);

        try {
            const response = await fetch("/api/users/me/profile", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    email: account.email,
                    username: account.username
                })
            });

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }


        } catch (error) {
            console.error("Failed to update profile info:", error);
        }

        setAccountLoading(false);
        setAccountSaved(true);
    }

    // Save updated password information
    async function handlePasswordSubmit(event) {
        event.stopPropagation();

        const errors = {};

        if (passwords.next.length < 8) 
            errors.next = "At least 8 characters required.";

        if (passwords.next !== passwords.confirm)
            errors.confirm = "Passwords do not match.";

        setPasswordErrors(e);

        if (Object.keys(errors).length > 0) {
            return;
        }

        try {
            const response = await fetch("/api/users/me/profile", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    password: passwords.next
                })
            });

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }
    
        } catch (error) {
            console.error("Failed to update profile info:", error);
        }

        setPasswordLoading(false);
        setPasswordSaved(true);
    }

    // Deletes user account after user confirms it in the pop-up modal
    async function handleDeleteSubmit() {
        try {
            const response = await fetch("/api/users/me/profile", {
                method: "DELETE",
                credentials: "include"
            });

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }

        } catch (error) {
            console.log("Failed to delete user profile:", error);
        }
    }



    if (authLoading) {
        return <div>Loading profile...</div>;
    }

    if (!user) {
        return null;
    }

    const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();

    const strength = passwordStrength(passwords.next);

    return (
        <div id="account-settings-page">

            {/* Page Header */}
            <div id="page-header">
                <Link 
                    to="/my-profile"
                    id="back-to-profile"
                >
                    <ArrowLeft size={12}/> Back to profile
                </Link>

                <h1 id="account-settings-title">Account Settings</h1>
            </div>

            <div id="page-sections">
                {/* Sidebar Options */}
                <aside id="sidebar-options">
                    <nav>
                        {SECTIONS.map((section) => {
                            const active = activeSection === section.id;
                            const isDanger = section.id === "danger";

                            return (
                                <button 
                                    key={section.id}
                                    className={`settings-option-btn ${isDanger ? "danger" : ""} ${active ? "active": ""}`}
                                    onClick={() => setActiveSection(section.id)}
                                >
                                    <span>{section.icon}</span>
                                    {section.label}
                                </button>
                            );
                            }
                        )}
                    </nav>
                </aside>

                {/* Tabs Section */}
                <main id="section-tabs">

                    {activeSection === "profile" && (
                        <ProfileSettingsSection
                            title="Public profile"
                            description="This information is visible to other researchers on Scholaris."
                        >
                            <div className="section">

                                {/* Avatar Placeholder */}
                                <div id="avatar-placeholder">
                                    <div id="avatar-initials">
                                        {user?.avatarURL
                                            ? <img src={user.avatarURL} alt="Profile Image" />
                                            : <span>{initials}</span>
                                        }
                                    </div>
                                    
                                    <div id="avatar-upload">
                                        {/* Hidden input element that handles the avatar's file upload */}
                                        <input 
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png"
                                            hidden
                                            onChange={handleAvatarSelect}
                                        />

                                        <button 
                                            id="avatar-upload-btn"
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            {user?.avatarURL ? "Change photo" : "Upload photo"}
                                        </button>

                                        {user?.avatarURL && 
                                            <button 
                                                id="avatar-rmv"
                                                onClick={handleAvatarRemove}
                                            >
                                                Remove photo
                                            </button>
                                        }
                                        <p>JPG or PNG, max 10MB</p>
                                    </div>
                                </div>

                                <div id="name-fields">
                                    <Field label="First Name" required>
                                        <TextInput 
                                            type="text"
                                            value={profile?.firstName}
                                            placeholder="John"
                                            autocomplete="first-name"
                                            onChange={(firstName) => 
                                                setProfile((prev) => ({
                                                    ...prev,
                                                    firstName
                                                })
                                            )}
                                        />
                                    </Field>

                                    <Field label="Last Name" required>
                                        <TextInput 
                                            type="text"
                                            value={profile?.lastName}
                                            placeholder="Doe"
                                            autocomplete="last-name"
                                            onChange={(lastName) => 
                                                setProfile((prev) => ({
                                                    ...prev,
                                                    lastName
                                                })
                                            )}
                                        />
                                    </Field>
                                </div>

                                <Field label="Bio" hint="Brief description of your research focus. Shown on your public profile.">
                                    <textarea 
                                        value={profile?.bio} 
                                        onChange={(event) => 
                                            setProfile((prev) => ({
                                                ...prev,
                                                bio: event.target.value
                                            })
                                        )} 
                                        rows={3} 
                                        placeholder="Tell other researchers about your work…"
                                        id="bio-textarea"
                                    
                                    onFocus={(e) => (e.target.style.borderColor = "#95D5B2")}
                                    onBlur={(e) => (e.target.style.borderColor = "rgba(26,26,20,0.16)")}
                                    />
                                </Field>

                                <Field label="Affiliation" hint="University, institution, or company">
                                    <TextInput 
                                        type="text"
                                        value={profile?.affiliation}
                                        placeholder="MIT, IBM Research, etc."
                                        autoComplete="affiliation"
                                        onChange={(affiliation) =>
                                            setProfile((prev) => ({
                                                ...prev,
                                                affiliation
                                            })
                                        )}
                                    />
                                </Field>

                                <Field label="Location" hint="City, country, etc.">
                                    <TextInput 
                                        type="text"
                                        value={profile?.location}
                                        placeholder="Boston, Massachusetts"
                                        autoComplete="location"
                                        onChange={(location) =>
                                            setProfile((prev) => ({
                                                ...prev,
                                                location
                                            })
                                        )}
                                    />
                                </Field>

                                <Field label="Role">
                                    <div id="role-dropdown-container">
                                        <select 
                                            id="role-dropdown"
                                            className={profile.role ? "form-role": ""}
                                            onChange={(event) => 
                                                setProfile((prev) =>({
                                                    ...prev,
                                                    role: event.target.value
                                                })
                                            )}
                                        >
                                            <option value="" disabled>Select your role...</option>
                                            {userRoles.map((role) => (
                                                <option key={role} value={role}>{role}</option>
                                            ))}
                                        </select>
                                    </div>
                                </Field>

                                <div id="save-profile">
                                    <SaveButton onClick={handleProfileSubmit} saved={profileSaved} loading={profileLoading} />
                                </div>
                            </div>
                            
                        </ProfileSettingsSection>
                    )}

                    {activeSection === "account" && (
                        <ProfileSettingsSection
                            title="Account"
                            description="Manage your email address and account preferences."
                        >
                            <div className="section">
                                <Field label="Email Address" required error={accountErrors.email}>
                                    <TextInput 
                                        type="text"
                                        value={account?.email}
                                        placeholder="johndoe@email.com"
                                        autoComplete="email"
                                        onChange={(email) =>
                                            setAccount((prev) => ({
                                                ...prev,
                                                email
                                            }))
                                        }
                                        hasError={!!accountErrors.username}
                                    />
                                </Field>

                                <Field label="Username" required hint="3-20 characters, letters, numbers, underscores." error={accountErrors.username}>
                                    <TextInput 
                                        type="text"
                                        value={account?.username}
                                        placeholder="johndoe12345"
                                        autoComplete="username"
                                        onChange={(username) =>
                                            setAccount((prev) => ({
                                                ...prev,
                                                username
                                            }))
                                        }
                                        error={accountErrors.username}
                                    />
                                </Field>

                                <div id="account-origin">
                                    <p>
                                        <strong>Account created</strong> • {user?.createdAt} <br />
                                        <strong>Last Sign in</strong> • {user?.lastLoginAt} 
                                    </p>
                                </div>

                                <div id="save-account">
                                    <SaveButton onClick={handleAccountSubmit} saved={accountSaved} loading={accountLoading} />
                                </div>
                            </div>

                        </ProfileSettingsSection>
                    )}

                    {activeSection === "password" && (
                        <ProfileSettingsSection
                            title="Change password"
                            description="Use a strong password you don't use anywhere else."
                        >
                            <div className="section">
                                <Field label="Current password" required>
                                    <PasswordInput 
                                        value={passwords.current}
                                        placeholder="Your current password"
                                        onChange={(current) => 
                                            setPasswords((prev) => ({
                                                ...prev,
                                                current
                                            })
                                        )}  
                                    />
                                </Field>

                                <Field label="New Password" required error={passwordErrors.next}>
                                    <PasswordInput 
                                        value={passwords.next}
                                        placeholder="At least 8 characters"
                                        autoComplete="new-password"
                                        onChange={(next) => 
                                            setPasswords((prev) => ({
                                                ...prev,
                                                next
                                            })
                                        )}
                                        hasError={!!passwordErrors.next}
                                    />

                                    {/* Estimation for Password Strength */}
                                    { 
                                        passwords.next.length > 0 && (
                                            <div id="strength-bar-container">
                                                <div id="strength-bar">
                                                    <div id="strength-bar-fill" className={strength.type || ""}/>
                                                </div>

                                                <span id="strength-estimation" className={strength.type || ""}>
                                                    {strength.label}
                                                </span>
                                            </div>
                                        )
                                    }
                                </Field>

                                <Field label="Confirm New Password" required error={passwordErrors.confirm}>
                                    <PasswordInput 
                                        value={passwords.confirm}
                                        placeholder="Confirm your password"
                                        autoComplete="confirm-password"
                                        onChange={(confirm) => 
                                            setPasswords((prev) => ({
                                                ...prev,
                                                confirm
                                            })
                                        )}
                                        hasError={!!passwordErrors.confirm}
                                    />

                                    {/* Indication for matching/non-matching Passwords */}
                                    {
                                        !passwordErrors.confirm && 
                                        passwords.confirm.length > 0 && 
                                        (passwords.next === passwords.confirm ? (
                                            <span id="passwords-match">
                                                <Check size={12} /> Passwords match
                                            </span>
                                        ) :
                                        (
                                            <span id="passwords-mismatch">
                                                <X size={12} /> Passwords don't match
                                            </span>
                                        ))
                                    }
                                </Field>

                                <div id="save-password">
                                    <SaveButton onClick={handlePasswordSubmit} saved={passwordSaved} loading={passwordLoading} />
                                </div>
                            </div>

                        </ProfileSettingsSection>
                    )}

                    {activeSection === "danger" && (
                        <ProfileSettingsSection
                            title="Danger zone"
                            description="Irreversible and destructive actions. Proceed with care."
                            danger
                        >
                            <div className="danger-section">
                                <div>
                                    <p id="delete-title"> Delete this account </p>
                                    <p id="delete-msg">
                                        Permanently remove your account and all associated data. This cannot be undone.
                                    </p>
                                </div>

                                <button
                                    id="delete-btn"
                                    onClick={() => setShowDeleteModal(true)}
                                >
                                    <span> <Trash2 size={13} /> Delete account </span>
                                </button>
                            
                            </div>

                        </ProfileSettingsSection>
                    )}

                </main>
            </div>

            {showDeleteModal && (
                <DeleteModal 
                    onClose={() => setShowDeleteModal(false)}
                    onDelete={handleDeleteSubmit}
                    profileInfo={profileInfo}
                />
            )}
        </div>
    );
}

export default AccountSettingsPage;