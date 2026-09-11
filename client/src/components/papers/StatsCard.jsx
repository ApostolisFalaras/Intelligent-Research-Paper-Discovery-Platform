import "../../styles/papers.css";

function StatsCard({ label, value, sublabel, accent }) {
	return (
		<div className={`metric ${accent ? "accent": ""}`}>
			<p className={`metric-title ${accent ? "accent": ""}`}>{label}</p>
			<p className={`metric-value ${accent ? "accent": ""}`}>
				{typeof value === "number" ? value.toLocaleString() : value}
			</p>

			{sublabel && <p className={`metric-sublabel ${accent ? "accent": ""}`}>{sublabel}</p>}
		</div>
	);
}

export default StatsCard;