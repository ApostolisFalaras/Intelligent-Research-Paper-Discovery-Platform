import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, SlidersHorizontal, X, Minus } from "lucide-react";
import FilterSection from "./components/search/FilterSection.jsx";
import ToggleItem from "./components/search/ToggleItem.jsx";
import TopicSelect from "./components/search/TopicSelect.jsx";
import SkeletonCard from "./components/search/SkeletonCard.jsx";
import FetchError from "./components/common/FetchError.jsx";
import SearchPrompt from "./components/search/SearchPrompt.jsx";
import "./styles/search.css";
import PaperCard from "./components/papers/PaperCard.jsx";


// Constants
const MIN_YEAR = 1800;
const CURRENT_YEAR = new Date().getFullYear();

const PAPER_TYPES = [
    { value: "any-type", label: "Any Type", count: null },
    { value: "article", label: "Journal article", count: 749469 },
    { value: "book", label: "Book", count: 105554 },
    { value: "book-chapter", label: "Book chapter", count: 59070 },
    { value: "review", label: "Review article", count: 27531 },
    { value: "preprint", label: "Preprint", count: 4544 },
    { value: "dissertation", label: "Dissertation / Thesis", count: 4321 },
    { value: "dataset", label: "Dataset", count: 3227 },
    { value: "other", label: "Other", count: 7809 }
]; 

const LANGUAGES = [
    {value: "af", label: "Afrikaans"},
    {value: "aig", label: "Antigua and Barbuda Creole English"},
    {value: "albanian", label: "Albanian"},
    {value: "als", label: "Swiss German"},
    {value: "ang", label: "Old English"},
    {value: "ar", label: "Arabic"},
    {value: "arb", label: "Standard Arabic"},
    {value: "ast", label: "Asturian"},
    {value: "az", label: "Azerbaijani"},
    {value: "azb", label: "South Azerbaijani"},
    {value: "bar", label: "Bavarian"},
    {value: "basque", label: "Basque"},
    {value: "bcl", label: "Central Bikol"},
    {value: "bg", label: "Bulgarian"},
    {value: "bh", label: "Bihari"},
    {value: "bi", label: "Bislama"},
    {value: "bn", label: "Bengali"},
    {value: "bpy", label: "Bishnupriya Manipuri"},
    { value: "br", label: "Breton" },
    { value: "bs", label: "Bosnian" },
    { value: "ca", label: "Catalan" },
    { value: "cbk", label: "Chavacano" },
    { value: "ceb", label: "Cebuano" },
    { value: "cjy", label: "Jinyu Chinese" },
    { value: "ckb", label: "Central Kurdish" },
    { value: "cmn", label: "Mandarin Chinese" },
    { value: "cs", label: "Czech" },
    { value: "csc", label: "Catalan Sign Language" },
    { value: "cy", label: "Welsh" },
    { value: "da", label: "Danish" },
    { value: "de", label: "German" },
    { value: "dsb", label: "Lower Sorbian" },
    { value: "el", label: "Greek" },
    { value: "en", label: "English" },
    { value: "enc", label: "Enochian" },
    { value: "enm", label: "Middle English" },
    { value: "eo", label: "Esperanto" },
    { value: "es", label: "Spanish" },
    { value: "et", label: "Estonian" },
    { value: "eu", label: "Basque" },
    { value: "fa", label: "Persian" },
    { value: "fi", label: "Finnish" },
    { value: "fr", label: "French" },
    { value: "fy", label: "West Frisian" },
    { value: "ga", label: "Irish" },
    { value: "gd", label: "Scottish Gaelic" },
    { value: "gl", label: "Galician" },
    { value: "grc", label: "Ancient Greek" },
    { value: "gsg", label: "German Sign Language" },
    { value: "he", label: "Hebrew" },
    { value: "hi", label: "Hindi" },
    { value: "hr", label: "Croatian" },
    { value: "ht", label: "Haitian Creole" },
    { value: "hu", label: "Hungarian" },
    { value: "hy", label: "Armenian" },
    { value: "ia", label: "Interlingua" },
    { value: "id", label: "Indonesian" },
    { value: "ie", label: "Interlingue" },
    { value: "ilo", label: "Ilocano" },
    { value: "io", label: "Ido" },
    { value: "is", label: "Icelandic" },
    { value: "it", label: "Italian" },
    { value: "ja", label: "Japanese" },
    { value: "jbo", label: "Lojban" },
    { value: "jv", label: "Javanese" },
    { value: "ka", label: "Georgian" },
    { value: "kaa", label: "Karakalpak" },
    { value: "kk", label: "Kazakh" },
    { value: "kmr", label: "Northern Kurdish" },
    { value: "kn", label: "Kannada" },
    { value: "ko", label: "Korean" },
    { value: "ku", label: "Kurdish" },
    { value: "kw", label: "Cornish" },
    { value: "ky", label: "Kyrgyz" },
    { value: "la", label: "Latin" },
    { value: "lb", label: "Luxembourgish" },
    { value: "li", label: "Limburgish" },
    { value: "lmo", label: "Lombard" },
    { value: "lt", label: "Lithuanian" },
    { value: "lv", label: "Latvian" },
    { value: "mg", label: "Malagasy" },
    { value: "min", label: "Minangkabau" },
    { value: "mis", label: "Uncoded Language" },
    { value: "mk", label: "Macedonian" },
    { value: "ml", label: "Malayalam" },
    { value: "mn", label: "Mongolian" },
    { value: "mr", label: "Marathi" },
    { value: "ms", label: "Malay" },
    { value: "mt", label: "Maltese" },
    { value: "mul", label: "Multiple Languages" },
    { value: "my", label: "Burmese" },
    { value: "nb", label: "Norwegian Bokmål" },
    { value: "nds", label: "Low German" },
    { value: "ng", label: "Ndonga" },
    { value: "nl", label: "Dutch" },
    { value: "nn", label: "Norwegian Nynorsk" },
    { value: "no", label: "Norwegian" },
    { value: "non", label: "Old Norse" },
    { value: "nr", label: "South Ndebele" },
    { value: "oc", label: "Occitan" },
    { value: "ory", label: "Odia" },
    { value: "other", label: "Other" },
    { value: "pl", label: "Polish" },
    { value: "pms", label: "Piedmontese" },
    { value: "prm", label: "Prasuni" },
    { value: "pt", label: "Portuguese" },
    { value: "rm", label: "Romansh" },
    { value: "ro", label: "Romanian" },
    { value: "ru", label: "Russian" },
    { value: "sa", label: "Sanskrit" },
    { value: "sco", label: "Scots" },
    { value: "se", label: "Northern Sami" },
    { value: "sh", label: "Serbo-Croatian" },
    { value: "sk", label: "Slovak" },
    { value: "sl", label: "Slovenian" },
    { value: "sol", label: "Solos" },
    { value: "spa", label: "Spanish" },
    { value: "sq", label: "Albanian" },
    { value: "sr", label: "Serbian" },
    { value: "su", label: "Sundanese" },
    { value: "sv", label: "Swedish" },
    { value: "sw", label: "Swahili" },
    { value: "ta", label: "Tamil" },
    { value: "te", label: "Telugu" },
    { value: "tg", label: "Tajik" },
    { value: "th", label: "Thai" },
    { value: "ti", label: "Tigrinya" },
    { value: "tl", label: "Tagalog" },
    { value: "tql", label: "Toki Pona" },
    { value: "tr", label: "Turkish" },
    { value: "tt", label: "Tatar" },
    { value: "uk", label: "Ukrainian" },
    { value: "uz", label: "Uzbek" },
    { value: "vi", label: "Vietnamese" },
    { value: "vo", label: "Volapük" },
    { value: "wa", label: "Walloon" },
    { value: "war", label: "Waray" },
    { value: "xx", label: "Unknown" },
    { value: "yi", label: "Yiddish" },
    { value: "zh", label: "Chinese" },
    { value: "zu", label: "Zulu" },
    { value: "zxx", label: "No Linguistic Content" },
    { value: "英语", label: "Unknown" },
];
    
// Initialize Filters
function createInitialFilters() {
    return {
        openAccessOnly: true,
        hasPDFAvailable: false,
        years: {
            fromYear: "",
            toYear: ""
        },
        paperType: "any-type",
        language: "",
        author: "",
        minCitations: "",
        topic: "",
        hasRetracted: false,
        sort: "relevance"
    };
}

// Validation helpers
// Validate existing input search query
function validateSearchQuery(query) {
    if (!query.trim()) {
        toast.warning("No search query", {
            description: "Enter a keyword in the search bar before applying filters",
            duration: 3000
        });

        return false;
    }
    return true;
}

// Validate years filter
function validateYearsFilter(years) {
    const fromYear = years.fromYear === "" ? null : Number(years.fromYear);
    const toYear = years.toYear === "" ? null : Number(years.toYear);

    let yearFromError, yearToError;

    if (fromYear != null) {
        if (fromYear < MIN_YEAR) yearFromError = `Min ${MIN_YEAR}`;
        else if (fromYear > CURRENT_YEAR) yearFromError = `Max ${CURRENT_YEAR}`;
        else if (toYear != null && fromYear > toYear) yearFromError = "From > To";
    }

    if (toYear != null) {
        if (toYear < MIN_YEAR) yearToError = `Min ${MIN_YEAR}`;
        else if (toYear > CURRENT_YEAR) yearToError = `Max ${CURRENT_YEAR}`;
    }

    return {
        yearFromError,
        yearToError
    }
}

// Validate selected minimum citations
function validateMinimumCitationFilter(minCitations) {
    if (minCitations === "") {
        return null;
    }

    const value = Number(minCitations);
    if (!Number.isFinite(value)) {
        return "Enter a valid number";
    }

    if (value < 0) {
        return "Must be ≥ 0";
    }

    return null;
}

// Search helpers
// Build search params for backend API /api/search request 
function buildSearchParams({ query, filters, debouncedAuthor, page, limit}) {
    const params = new URLSearchParams();

    if (query.trim()) {
        params.set("query", query.trim());
    }

    params.set("page", String(page));
    params.set("limit", String(limit));
    params.set("sort", filters.sort);

    if (filters.openAccessOnly) { params.set("isOpenAccess", "true"); }

    if (filters.hasPDFAvailable) { params.set("hasContentPDF", "true"); }

    if (filters.years.fromYear !== "") { params.set("fromYear", filters.years.fromYear); }
    
    if (filters.years.toYear !== "") { params.set("toYear", filters.years.toYear); }

    if (filters.paperType !== "any-type") { params.set("paperType", filters.paperType); }

    if (filters.language !== "") { params.set("language", filters.language); }

    if (debouncedAuthor.trim() !== "") { params.set("authorName", debouncedAuthor.trim()); }

    if (filters.minCitations !== "") { params.set("minCitations", filters.minCitations); }

    if (filters.topic !== "") { params.set("topicId", filters.topic); }

    if (!filters.hasRetracted) { params.set("isRetracted", "false"); }

    return params;
}

// Count active filters
function countActiveFilters(filters) {
    return (
        (!filters.openAccessOnly ? 1 : 0) +
        (filters.hasPDFAvailable ? 1 : 0) +
        ((filters.years.fromYear || filters.years.toYear) ? 1 : 0) +
        (filters.hasRetracted ? 1 : 0) + 
        (filters.paperType !== "any-type" ? 1 : 0) +
        (filters.language !== "" ? 1 : 0) +
        (filters.author.trim() !== "" ? 1 : 0) + 
        (filters.minCitations !== "" ? 1 : 0) +
        (filters.topic !== "" ? 1 : 0) +
        (filters.sort !== "relevance" ? 1 : 0)
    );
}

// Create page items
function createPageItems(page, totalPages) {
    if (totalPages <= 3) {
        return Array.from({length: totalPages}, (_,index) => index + 1);
    }
    else if (page <= 2) { 
        return [1, 2, 3, "...", totalPages]; 
    }
    else if (page === 3) { 
        return [1, 2, 3, 4, "...", totalPages];
    }
    else if (page === totalPages - 2) {
        return [1, "...", totalPages-3, totalPages-2, totalPages-1, totalPages];
    }
    else if (page >= totalPages - 1) {
        return [1, "...", totalPages-2, totalPages-1, totalPages];    
    }
    else {
        return [1, "...", page-1, page, page+1, "...", totalPages];
    }
}

// Create active pill
function createActivePills(filters, updateFilter, updateYearFilter) {
    const pills = [];

    if (filters.openAccessOnly === false) {
        pills.push({label: "All access", clear: () => updateFilter("openAccessOnly", true)});
    }

    if (filters.hasPDFAvailable === true) {
        pills.push({label: "PDF only", clear: () => updateFilter("hasPDFAvailable", false)});
    }

    if (filters.years.fromYear !== "") {
        pills.push({label: `From ${filters.years.fromYear}`,
                    clear: () => updateYearFilter("fromYear", "")});
    }

    if (filters.years.toYear !== "") {
        pills.push({label: `To ${filters.years.toYear}`,
                    clear: () => updateYearFilter("toYear", "")});
    }

    if (filters.paperType !== "any-type") {
        pills.push({label: PAPER_TYPES.find((type) => type.value === filters.paperType)?.label ?? filters.paperType,
                    clear: () => updateFilter("paperType", "any-type")});
    }

    if (filters.language !== "") {
        pills.push({label: filters.language, clear: () => updateFilter("language", "")});
    }

    if (filters.author?.trim() !== "") {
        pills.push({label: `Author: ${filters.author}`, clear: () => updateFilter("author", "")});
    }

    if (filters.minCitations !== "") {
        pills.push({label: `≥ ${filters.minCitations} citations`,
                    clear: () => updateFilter("minCitations", "")});
    }

    if (filters.topic !== "") {
        pills.push({label: `Topic: ${filters.topic}`, clear: () => updateFilter("topic", "")});
    }

    if (filters.hasRetracted === true) {
        pills.push({label: "Including retracted", clear: () => updateFilter("hasRetracted", false)});
    }

    if (filters.sort !== "relevance") {
        pills.push({label: `Sort: ${filters.sort}`, clear: () => updateFilter("sort", "relevance")});
    }
    
    return pills;
}



function SearchPage() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get("query") ?? "";

    const [filters, setFilters] = useState(createInitialFilters);
    const [debouncedAuthor, setDebouncedAuthor] = useState(filters.author);
    const [limit, setLimit] = useState(25);
    const [page, setPage] = useState(1);

    const [searchResults, setSearchResults] = useState({
        totalResults: 0,
        papers: []
    });

    const [status, setStatus] = useState("idle");
    const [fetchError, setFetchError] = useState("");

    // Update filter value
    function updateFilter(name, value) {
        setFilters((prev) => ({
            ...prev,
            [name]: value
        }));

        setPage(1);
    }

    // Update year's nested filters
    function updateYearFilter(name, value) {
        setFilters((prev) => ({
            ...prev,
            years: {
                ...prev.years,
                [name]: value
            }
        }));

        setPage(1);
    }

    // Update filter, only if the query is non-empty
    function applyFilterChange(callback) {
        if (!validateSearchQuery(query)) {
            return;
        }

        callback();
    }

    // Navigate to another page and scroll to the top of the page
    function changePage(newPage) {
        setPage(newPage);

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    // Update debounded author if the user stops typing for 500ms
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedAuthor(filters.author);
        }, 500);

        return () => clearTimeout(timer);
    }, [filters.author]);

    // Main search query function
    async function searchQuery() {
        if (!query.trim()) {
            setSearchResults({
                totalResults: 0,
                papers: []
            });

            setStatus("idle");
            return;
        }

        // Preventing invalid filter values from triggering API requests
        const { yearFromError, yearToError } = validateYearsFilter(filters.years);
        const minCitationsError = validateMinimumCitationFilter(filters.minCitations);

        if (yearFromError || yearToError || minCitationsError) {
            return;
        }

        setStatus("loading");
        setFetchError("");

        const params = buildSearchParams({query, filters, debouncedAuthor, page, limit});

        try {
            // Hit up the API's /api/search backend route
            const response = await fetch(`/api/search?${params.toString()}`, {
                    credentials: "include"
                }
            );

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }

            const results = await response.json();

            setSearchResults(results.data ?? {
                totalResults: 0,
                papers: []
            });
            setStatus("success");
        } catch (error) {
            console.error("Failed to fetch search results:", error);

            setSearchResults({
                totalResults: 0,
                papers: []
            });
            setStatus("error");
            setFetchError(
                "Could not reach the server. Check your connection and try again."
            );
        }
    }

    // Reset to the first page when the query changes
    useEffect(() => {
        setPage(1);
    }, [query]);

    // Perform search query when either the query or a filter changes 
    useEffect(() => {
        searchQuery();
    }, [
        query,
        filters.openAccessOnly,
        filters.hasPDFAvailable,
        filters.years.fromYear,
        filters.years.toYear,
        filters.paperType,
        filters.language,
        debouncedAuthor,
        filters.minCitations,
        filters.topic,
        filters.hasRetracted,
        filters.sort,
        page,
        limit,
    ]);

    // Validation values used by the rendered inputs
    const {yearFromError, yearToError} = validateYearsFilter(filters.years);
    const minCitationsError = validateMinimumCitationFilter(filters.minCitations);

    // Calculate filter totals
    const totalFiltersActive = countActiveFilters(filters);
    const activePills = createActivePills(filters, updateFilter, updateYearFilter);

    // Calculate results and required pages
    const resultsCount = searchResults.totalResults;
    const totalPages = Math.ceil(resultsCount / limit);
    const pageItems = createPageItems(page, totalPages);

    return (
        <div id="main-search-page">

            {/* Search Filters Sidebar Area */}

            <aside id="search-page-sidebar">
                <div id="filters-overview">
                    <div>
                        <SlidersHorizontal size={16} style={{color: "#2D6A4F"}} />
                        <span id="filters-header">Filters</span>
                        {totalFiltersActive > 0 && (
                            <span id="active-filters">{totalFiltersActive}</span>
                        )}
                    </div>

                    {totalFiltersActive > 0 && (
                        <button 
                            id="clear-filters"
                            onClick={() => {
                                setFilters(createInitialFilters());
                                setLimit(25);
                                setPage(1);
                            }}
                        >
                            Clear all
                        </button>
                    )}
                </div>

                {/* Open access and available PDFs filters */}
                <FilterSection title="Access">
                    <ToggleItem 
                        label="Open access only"
                        sublabel="Default on"
                        checked={filters.openAccessOnly}
                        onChange={() =>
                                applyFilterChange(() => {
                                    updateFilter("openAccessOnly", !filters.openAccessOnly);
                                })
                        }
                    />

                    <ToggleItem 
                        label="PDF Available"
                        checked={filters.hasPDFAvailable}
                        onChange={() =>
                                applyFilterChange(() => {
                                    updateFilter("hasPDFAvailable", !filters.hasPDFAvailable);
                                })
                        }
                    />
                </FilterSection>

                {/* Year range filters */}
                <FilterSection title="Year Range">
                    <div id="filter-years">
                        <div>
                            <input 
                                className={`input-filter years ${yearFromError ? "error" : ""}`}
                                type="number"
                                value={filters.years.fromYear}
                                onChange={(event) =>
                                    applyFilterChange(() => {
                                        updateYearFilter("fromYear", event.target.value);
                                    })
                                }
                                placeholder={MIN_YEAR}
                                min={MIN_YEAR}
                                max={CURRENT_YEAR}
                            />
                            {yearFromError && <p className="input-validation-error">{yearFromError}</p>}
                        </div>
                        <span id="year-dash">-</span>
                        <div>
                            <input 
                                className={`input-filter years ${yearToError ? "error" : ""}`}
                                type="number"
                                value={filters.years.toYear}
                                onChange={(event) =>
                                    applyFilterChange(() => {
                                        updateYearFilter("toYear", event.target.value);
                                    })
                                }
                                placeholder={CURRENT_YEAR}
                                min={MIN_YEAR}
                                max={CURRENT_YEAR}
                            />
                            {yearToError && <p className="input-validation-error">{yearToError}</p>}
                        </div>
                    </div>
                </FilterSection>

                {/* Paper type filter */}
                <FilterSection title="Publication Type">
                    {PAPER_TYPES.map((type) => {
                        const activeType = type.value === filters.paperType; 

                        return (
                            <label 
                                key={type.value} 
                                className="paper-type"
                                onClick={() =>
                                    applyFilterChange(() => {
                                        updateFilter("paperType", type.value);
                                    })
                                }
                            >
                                <div>
                                    <div className={`type-check ${activeType ? "active": ""}`}>
                                        {activeType && <div className="type-check-selected" />}
                                    </div>
                                    <span className={`type-label ${activeType ? "active": ""}`}>{type.label}</span>
                                </div>
                                {type.count != null && (
                                    <span className="type-count">
                                        {type.count >= 1000 ? `${(type.count / 1000).toFixed(0)}k` : type.count}
                                    </span>
                                )}
                            </label>
                        );
                    })}
                </FilterSection>
                
                {/* Language filters */}
                <FilterSection title="Language">
                    <div id="lang-dropdown-container">
                        <select 
                            value={filters.language}
                            id="lang-dropdown"
                            className={filters.language ? "has-selection" : ""}
                            onChange={(event) => 
                                applyFilterChange(() => {
                                    updateFilter("language", event.target.value);
                                })
                            }
                        >
                            <option value="">Any Language</option>
                            {LANGUAGES.map((lang) => (
                                <option key={lang.value} value={lang.label}>{lang.label}</option>
                            ))}
                        </select>

                        {filters.language && (
                            <button
                                id="lang-clear"
                                onClick={() => 
                                    applyFilterChange(() => {
                                        updateFilter("language", "");
                                    })
                                }
                            >
                                <X size={11} />
                            </button>
                        )}
                    </div>
                </FilterSection>

                {/* Author filter */}
                <FilterSection title="Author">
                    <div id="author-container">
                        <input 
                            type="text"
                            value={filters.author}
                            onChange={(event) => 
                                applyFilterChange(() => {
                                    updateFilter("author", event.target.value);
                                })
                            }
                            placeholder="e.g. Ashish Vaswani"
                            className="input-filter author"
                        />

                        {filters.author && (
                            <button
                                id="author-clear"
                                onClick={() => 
                                    applyFilterChange(() => {
                                        updateFilter("author", "");
                                    })
                                }
                            >
                                <X size={11} />
                            </button>
                        )}
                    </div>
                </FilterSection>
                
                {/* Topic filter */}
                <FilterSection title="Topics">
                    <TopicSelect
                        value={filters.topic}
                        onChange={(topic) => 
                            applyFilterChange(() => {
                                updateFilter("topic", topic);
                            })
                        }
                    />
                </FilterSection>

                {/* Minimun citations filter */}
                <FilterSection title="Minimum Citations">
                    <input 
                        type="number"
                        value={filters.minCitations}
                        onChange={(event) =>
                            applyFilterChange(() => {
                                updateFilter("minCitations", event.target.value);
                            })
                        }
                        placeholder="e.g., 1000"
                        min={0}
                        className={`input-filter ${minCitationsError ? "error" : ""}`}
                    />
                    {minCitationsError && <p className="input-validation-error">{minCitationsError}</p>}
                </FilterSection>

                {/* Include retracted papers filter */}
                <FilterSection title="Advanced">
                    <ToggleItem 
                        label="Include retracted"
                        sublabel="Hidden by default"
                        checked={filters.hasRetracted}
                        onChange={() => 
                            applyFilterChange(() => {
                                updateFilter("hasRetracted", !filters.hasRetracted);
                            })
                        }
                    />
                </FilterSection>

            </aside>

            {/* Results overview containing total count, and sorting tab options */}
            <main id="search-results-container">
                
                {/* Results count, total active filter pills, sorting options */}
                {(query !== "" && searchResults.totalResults >= 0) && (
                    <div id="results-overview">
                        <div id="results-totals">
                            <div>
                                <span id="total">{resultsCount}</span>
                                <span id="query">
                                    {" "}results{" "}
                                    {query && (<>for "{query}"</>)}
                                </span>
                                <span id="current-page">
                                    <Minus size={12} />
                                    {searchResults.totalResults > 0 ? page : 0} of {totalPages}
                                </span>
                            </div>

                            <div id="pagination-sorting">
                                {/* Selection of number of paper cards per page */}
                                <div id="pagination-overview">
                                    <span>Per page</span>
                                    <select 
                                        value={limit} 
                                        onChange={(event) => {
                                            setLimit(Number(event.target.value));
                                            setPage(1);
                                        }}
                                    >
                                        <option value={5}>5</option>
                                        <option value={15}>15</option>
                                        <option value={25}>25</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                    </select>
                                </div>

                                {/* Selection of Results sorting criterion */}
                                <div id="sorting-overview">
                                    {["relevance", "citations", "impact", "year"].map((key) => (
                                        <button
                                            key={key}
                                            className={`sorting-options ${filters.sort === key ? "active": ""}`}
                                            onClick={() => 
                                                applyFilterChange(() => {
                                                    updateFilter("sort", key);
                                                })
                                            }
                                        >
                                            {key}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Active pills corresponding to the provided search filters */}
                {activePills.length > 0 && (
                    <div id="active-pills">
                        {activePills.map((pill) => (
                            <span key={pill.label} className="pill">
                                {pill.label}
                                <button
                                    className="pill-clear"
                                    onClick={pill.clear}
                                >
                                    <X size={10} />
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                {status === "loading" 
                    ? (
                        <div id="loading-skeleton-cards">
                            {
                                Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
                            }
                        </div>
                    ) : status === "error" 
                        ? (
                            <FetchError fetchError={fetchError} retrySearchQuery={searchQuery} />
                        ) 
                        : (query === "" && searchResults.totalResults === 0) ? (
                            <SearchPrompt />
                        )
                        : (
                            <div id="result-papers">
                                {searchResults?.papers.map((paper) => (
                                    <PaperCard key={paper.id} paper={paper} variant="search" />
                                ))}
                            </div>
                        )
                }

                {(query !== "" && searchResults.totalResults > 0) && (
                    <div id="pages-section">
                        <button 
                            id="prev-page-btn"
                            className={page === 1 ? "first-page": ""}
                            disabled={page === 1}
                            onClick={() => changePage(page - 1)}
                        >
                            <ChevronLeft size={13} /> Previous
                        </button>

                        <div id="page-indicator">
                            {pageItems.map((item, index) => (
                                item === "..." 
                                    ? (
                                        <span 
                                            key={`ellipsis-${index}`}
                                            className="ellipsis-item"
                                        >
                                            ...
                                        </span>
                                    ) 
                                    : (
                                        <button
                                            key={item}
                                            className={`page-item ${page === item ? "active" : ""}`}
                                            onClick={() => changePage(item)}
                                        >
                                            {item}
                                        </button>
                                    )
                            ))}
                        </div>
                            
                        <button 
                            id="next-page-btn"
                            className={page === totalPages ? "last-page" : ""}
                            disabled={page === totalPages}
                            onClick={() => changePage(page + 1)}
                        >
                            Next <ChevronRight size={13} />
                        </button>
                    </div>
                )}


                
            </main>
        </div>
    );
}



export default SearchPage;