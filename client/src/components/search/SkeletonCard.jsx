import "../../styles/search.css";

function SkeletonCard() {

	/* Declaring this set of styles inline to avoid congesting the search.css file */
	/* Only the 'scholaris-pulse' animation is declared there */
	return (
		<article style={{ width: "85%", marginTop: "8px", marginLeft: "72px", background: "#FFFFFF", border: "1px solid rgba(26,26,20,0.09)", borderRadius: "6px", padding: "22px 24px" }}>
			<div style={{ animation: "scholaris-pulse 1.6s ease-in-out infinite" }}>
				<div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
					<div style={{ width: "48px", height: "18px", background: "#E8E6DE", borderRadius: "3px"}} />
					<div style={{ width: "32px", height: "18px", background: "#E8E6DE", borderRadius: "3px"}} />
					<div style={{ width: "56px", height: "18px", background: "#E8E6DE", borderRadius: "3px"}} />
					<div style={{ marginLeft: "auto", width: "80px", height: "18px", background: "#E8E6DE", borderRadius: "3px"}} />
				</div>
				<div style={{ height: "22px", background: "#E8E6DE", borderRadius: "4px", marginBottom: "8px", width: "78%" }} />
				<div style={{ height: "22px", background: "#E8E6DE", borderRadius: "4px", marginBottom: "12px", width: "52%" }} />
				<div style={{ height: "14px", background: "#F0EDE6", borderRadius: "3px", marginBottom: "6px" }} />
				<div style={{ height: "14px", background: "#F0EDE6", borderRadius: "3px", width: "88%", marginBottom: "14px" }} />
				<div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
					<div style={{ width: "88px", height: "13px", background: "#E8E6DE", borderRadius: "3px" }} />
					<div style={{ width: "72px", height: "13px", background: "#E8E6DE", borderRadius: "3px" }} />
					<div style={{ marginLeft: "auto", width: "88px", height: "28px", background: "#E8E6DE", borderRadius: "4px" }} />
				</div>
			</div>
		</article>
	);
}

export default SkeletonCard;