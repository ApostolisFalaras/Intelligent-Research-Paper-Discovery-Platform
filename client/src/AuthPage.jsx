import { useState } from "react";
import { Check } from "lucide-react";
import LoginForm from "./components/auth/LoginForm.jsx";
import SignupForm from "./components/auth/SignupForm.jsx";
import "./styles/auth.css";

function AuthPage() {
	const [selectedTab, setSelectedTab] = useState("Sign in");

	return (
		<main id="main-auth-page">
			<div id="panel-columns">
				<div id="brand-panel">
					<div className="grid-lines" />

					<div id="brand-div">
						<p id="brand-subtitle">Research Intelligence</p>
						<h2 id="brand-title">
							Your library <br />
							<em>personalized</em>
						</h2>

						<p id="brand-message">
							Save papers, 
							track citations, 
							get recommendations tailored to your research - all in one place
						</p>

						{[
							"Personalized paper recommendations",
							"Reading history & saved collections",
							"citation alerts & author follows"
						].map((feature) => (
							<div className="brand-features">
								<div>
									<Check size={10} color="#95D5B2" />
								</div>
								<span>{feature}</span>
							</div>
						))}

					</div>
				</div>

				<div id="form-panel">
					<div>
						{/* Tabs switching betwen login and sign-up form */}
						<div id="tab-switcher">
							{["Sign in", "Create account"].map((tab) => (
								<button 
									key={tab}
									onClick={() => setSelectedTab(tab)}
									className={`auth-tab ${selectedTab === tab ? "selected" : ""}`}
								>
									{tab}
								</button>
							))}
						</div>

						<h1 id="form-title">
							{ selectedTab === "Sign in" ? "Welcome back" : "Join Scholaris" }
						</h1>

						<p id="form-message">
							{ selectedTab === "Sign in" 
								? "Sign in to access your personalized research feed."
								: "Create a free account to save papers and get recommendations"						
							}
						</p>
						
						{selectedTab === "Sign in" ? <LoginForm /> : <SignupForm />}

						<p id="form-bottom">
							{selectedTab === "Sign in" ? (
								<>
									Don't have an account?
									<button 
										className="form-bottom-btn"
										onClick={() => setSelectedTab("Create account")}
									>
										Create One
									</button>
								</>
							) : (
								<>
									Already have an account?
									<button 
										className="form-bottom-btn"
										onClick={() => setSelectedTab("Sign in")}
									>
										Sign in
									</button>
								</>
							)}
						</p>
						
					</div>
				</div>
			</div>
		</main>
	);
}

export default AuthPage;