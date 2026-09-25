import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
	ResponsiveContainer, Legend } from "recharts";
import "./../../styles/authors.css";


function formatNumber(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}


// Recharts supplies those props automatically
// active -> whether tooltip should be shown
// label -> x-axis value year
// payload -> contains the values for all chart series for the current year
function CustomTooltip({active, payload, label}) {
	if (!active || !payload?.length) {
		return null;
	}
	
	return (
		<div id="custom-tooltip">
			<p id="custom-tooltip-label">{label}</p>
			{payload.map((p) => (
				<p key={p.name} className="custom-tooltip-payload" style={{ color: p.color }}>
					{p.name}: <strong>{typeof p.value === "number" && p.value >= 1000 ? formatNumber(p.value) : p.value}</strong>
				</p>
			))}
		</div>
		);
}


function CitationsChart({ data = [] }) {
	
	// Sorting citation data chronologically
	const sortedData = [...data].sort((a,b) => a.year - b.year);


	return (
		<div id="citations-chart">
			<p>Output & Citations by Year</p>
			
			<ResponsiveContainer width="100%" height={220}>

				{/* ComposedChart allows multiple visualizations tyles together */}
				<ComposedChart data={sortedData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
					<CartesianGrid vertical={false} stroke="rgba(26,26,20,0.06)"/>
					<XAxis 
						dataKey="year" 
						tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fill: "#9B9B8A"}}
						axisLine={false}
						tickLine={false}
					/>
					<YAxis 
						yAxisId="worksCount" 
						orientation="left"
						tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fill: "#9B9B8A" }}
						axisLine={false} 
						tickLine={false} 
						width={28}
					/>
					<YAxis 
						yAxisId="citedByCount" 
						orientation="right"
						tickFormatter={(v) => formatNumber(v)}
						tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fill: "#9B9B8A" }}
						axisLine={false} 
						tickLine={false} 
						width={44}
					/>
					<Tooltip content={<CustomTooltip />} />
					<Legend wrapperStyle={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", paddingTop: "8px" }} />
					<Bar yAxisId="worksCount" dataKey="worksCount" name="Publications" fill="#B7E4C7" radius={[3, 3, 0, 0]} maxBarSize={32} />
					<Bar yAxisId="oaWorksCount" dataKey="oaWorksCount" name="Open Access" fill="#52B788" radius={[3, 3, 0, 0]} maxBarSize={32} />
					<Line yAxisId="citedByCount" dataKey="citedByCount" name="Citations" stroke="#1B4332" strokeWidth={2} dot={{ fill: "#1B4332", r: 3 }} activeDot={{ r: 5 }} />
				</ComposedChart>
			</ResponsiveContainer>
		</div>
	);
}

export default CitationsChart;