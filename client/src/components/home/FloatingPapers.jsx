import "../../styles/home.css";

function FloatingPapers() {
	// Floating Papers animation in the Home Page, in the hero section
	// Each paper is defined as an an object of mathematically randomized features:
	// dimensions (width,height), timing of animation (delay,duration), opacity, position(x, rotation)
	const papers = Array.from({ length: 22 }, (_, i) => ({
		id: i,
		x: Math.random() * 100,
		delay: Math.random() * 8,
		duration: 14 + Math.random() * 10,
		width: 80 + Math.random() * 60,
		height: 100 + Math.random() * 70,
		opacity: 0.06 + Math.random() * 0.10,
		rotation: -15 + Math.random() * 30,
	}));

	return (
		<div id="floating-papers">
			{papers.map((p) => (
				<div 
					key={p.id} 
					className="floating-paper"
					style={{
						left: `${p.x}%`,
						width: `${p.width}px`,
						height: `${p.height}px`,
						opacity: p.opacity,
						"--rot": `${p.rotation}deg`,
						animation:  `floatUp ${p.duration}s ${p.delay}s linear infinite`
					}}
				>
					
					<div className="animated-paper">
						<div className="main-paper-title" />
            			<div className="secondary-paper-title" />
            			<div className="author-names" />

						{[85, 90, 80, 88, 75, 90, 83].map((w, i) => (
							<div key={i} className="fake-abstract-line"
								style={{
									backgroundColor: `rgba(27,67,50,${0.1 + (i % 3) * 0.03})`,
									width: `${w}%`,
								}}
							/>
							))}
					</div>

				</div>
			))}
		</div>
	);
}

export default FloatingPapers;