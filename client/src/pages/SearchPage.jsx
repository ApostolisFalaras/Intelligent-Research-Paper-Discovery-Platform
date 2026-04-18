import PaperGrid from "./../papers/PaperGrid.jsx";

function SearchPage() {
    return (
        <div>
            <h1>Search Results</h1>
            <PaperGrid papers={[]} />
        </div>
    );
}

export default SearchPage;