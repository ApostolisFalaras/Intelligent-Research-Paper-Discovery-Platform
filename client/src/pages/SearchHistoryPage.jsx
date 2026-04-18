import SearchHistoryList from "./../profile/SearchHistoryList.jsx";

function SearchHistoryPage() {
    return (
        <section className="search-history-page">
            <header className="search-history-page-header">
                <h1>Search History</h1>
                <p>Review your recent searches and revisit previous queries.</p>
            </header>

            <SearchHistoryList history={[]} />
        </section>
    );
}

export default SearchHistoryPage;