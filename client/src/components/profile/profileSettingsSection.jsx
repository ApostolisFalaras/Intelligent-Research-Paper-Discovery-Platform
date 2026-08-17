import "./../../styles/profile.css";

function ProfileSettingsSection({ title, description, children, danger }) {

	return (
		<div className={`settings-section ${danger ? "danger" : ""}`}>
			<div className={`settings-header ${danger ? "danger" : ""}`}>
				<h2 className={`section-title ${danger ? "danger" : ""}`}>{title}</h2>
				{
					description && 
					<p className={`section-description ${danger ? "danger" : ""}`}>{description}</p>
				}
			</div>

			<div style={{ padding: "24px" }}>{children}</div>
		</div>
	);
}

export default ProfileSettingsSection;