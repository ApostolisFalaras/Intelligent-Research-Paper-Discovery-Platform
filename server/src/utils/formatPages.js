export function formatPage(firstPage, lastPage) {
    if (!firstPage && !lastPage)
        return null;

    // Display format when both page numbers are available
    if (firstPage && lastPage & firstPage !== lastPage) {
        return `${firstPage}-${lastPage}`;
    }

    // In case only 1/2 pages exist
    return firstPage || lastPage;
}
