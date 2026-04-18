import PaperMetadata from "./../components/papers/PaperMetadata.jsx";
import PaperAbstract from "./../components/papers/PaperAbstract.jsx";
import PaperActions from "./../components/papers/PaperActions.jsx";

function PaperPage() {
    const paper = { abstract: "placeholder abstract", pdfULR: "placeholder URL"}
    return (
        <div>
            <PaperMetadata paper={paper}/>
            <PaperAbstract abstract={paper.abstract}/>
            <PaperActions pdfURL={paper.pdfURL}/>
        </div>
    );
}

export default PaperPage;