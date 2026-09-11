import { Lock, Unlock } from "lucide-react";
import "../../styles/papers.css";

function OABadge({ status }) {
	const map = {
		gold: { label: "Gold OA", type: "gold" },
		green: { label: "Green OA", type: "green" },
		diamond: { label: "Diamond OA", type: "diamond" },
		hybrid: { label: "Hybrid OA", type: "hybrid" },
		bronze: { label: "Bronze OA", type: "bronze" },
		closed: { label: "Closed", type: "closed" }
	};

	const selected = map[status] ?? map.closed;

	return (
		<span className={`oa-status ${selected.type}`}>
			{status === "closed" ? <Lock size={10}/> : <Unlock size={10}/> }
			{selected.label}
		</span>
	);
}

export default OABadge;