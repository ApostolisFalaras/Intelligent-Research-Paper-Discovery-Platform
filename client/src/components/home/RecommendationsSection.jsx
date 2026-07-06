import { Star, Users, TrendingUp } from "lucide-react";
import RecommendationsRow from "./RecommendationsRow.jsx";
import "./../../styles/home.css";

const papers = [
	{
		id: 1,
		openalexId: 1,
		title: "Attention Is All You Need",
		displayName: "Attention Is All You Need",
		publicationYear: 2017,
		abstract: null,
		citedByCount: 87420,
		fwci: 1000.45,
		primarySource: "NeurIPS",
		primaryTopic: "Machine Learning",
		isOpenAccess: true,
		openAccessStatus: "gold",
		rank: 1,
		authorCount: 5,
		authorPreview: [
			{ openalexId: 1, authorDisplayName: "Ashish Vaswani" },
			{ openalexId: 2, authorDisplayName: "Noam Shazeer" }
		]
	},
	{
		id: 2,
		openalexId: 2,
		title: "Deep Residual Learning for Image Recognition",
		displayName: "Deep Residual Learning for Image Recognition",
		publicationYear: 2016,
		abstract: null,
		citedByCount: 143200,
		fwci: 1000.45,
		primarySource: "CVPR",
		primaryTopic: "Computer Vision",
		isOpenAccess: true,
		openAccessStatus: "gold",
		rank: 2,
		authorCount: 4,
		authorPreview: [
			{ openalexId: 1, authorDisplayName: "Kaiming He" },
			{ openalexId: 2, authorDisplayName: "Xiangyu Zhang" }
		]
	},
	{
		id: 3,
		openalexId: 3,
		title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
		displayName: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
		publicationYear: 2019,
		abstract: null,
		citedByCount: 52100,
		fwci: 1000.45,
		primarySource: "NAACL",
		primaryTopic: "Natural Language Processing",
		isOpenAccess: true,
		openAccessStatus: "gold",
		rank: 3,
		authorCount: 6,
		authorPreview: [
			{ openalexId: 1, authorDisplayName: "Jacob Devlin" },
			{ openalexId: 2, authorDisplayName: "Ming-Wei Chang" }
		]
	},
	{
		id: 3,
		openalexId: 3,
		title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
		displayName: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
		publicationYear: 2019,
		abstract: null,
		citedByCount: 52100,
		fwci: 1000.45,
		primarySource: "NAACL",
		primaryTopic: "Natural Language Processing",
		isOpenAccess: true,
		openAccessStatus: "gold",
		rank: 3,
		authorCount: 6,
		authorPreview: [
			{ openalexId: 1, authorDisplayName: "Jacob Devlin" },
			{ openalexId: 2, authorDisplayName: "Ming-Wei Chang" }
		]
	}
];

function RecommendationsSection({ firstName, lastName }) {
	return (
		<main id="main-section">
			<div id="main-section-header">
				<p>Personalized for you • {firstName} {lastName}</p>
				<h2>Your research feed</h2>
			</div>

			<RecommendationsRow 
				label="Based on your activity" 
				sublabel="Updated 2 hours ago" 
				icon={<Star size={15} />}
				papers={papers}
			/>
			{/*<RecommendationsRow 
				label="Similar users also viewed"
				sublabel="Researchers in NLP & ML"
				icon={<Users size={15} />}
			/>
			<RecommendationsRow 
				label="Trending in Machine Learning"
				sublabel="Past 30 days • 4,200 new papers"
				icon={<TrendingUp size={15} />}
			/>*/}
		</main>
	);
}

export default RecommendationsSection;