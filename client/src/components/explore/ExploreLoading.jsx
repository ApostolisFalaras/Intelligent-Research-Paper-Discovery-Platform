import { Compass } from "lucide-react";
import "../../styles/explore.css";

function ExploreLoading() {
    return (
        <div id="explore-loading">
            <div id="explore-loading-icon">
                <Compass size={26} strokeWidth={2} />
            </div>

            <p id="explore-loading-title">
                Discovering research topics
            </p>

            <p id="explore-loading-msg">
                We're selecting a random collection of research areas for you
                to explore. This usually takes only a moment.
            </p>
        </div>
    );
}

export default ExploreLoading;