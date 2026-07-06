import "./../../styles/home.css";

// Global-level application stats
const appStats = [
	{ label: "Papers Indexed", value: "1M+" },
	{ label: "Authors", value: "100K" },
	{ label: "Scientific Topics", value: "4.5K+" },
	{ label: "Open Access", value: "40%" }
];

function StatsStrip() {
	return (
		<div id="stats-strip">
			{appStats.map((stat, i) =>(
				<div key={stat.label} className="app-stat" style={{borderLeft: i > 0 ? "1px solid rgba(26,26,20,0.08)" : "none"}}>
					<p className="stat-value">{stat.value}</p>
					<p className="stat-label">{stat.label}</p>
				</div>
			))}
		</div>
	);
}

export default StatsStrip;