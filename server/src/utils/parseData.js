import { AppError } from "./AppError.js";

// Functions that parse search filters on,
// i) the search operation, or
// ii) on filtering records from the user's search history

// Validate string data fields (query, topicId, sourceId, authorId)
export function parseString(filter, name) {
    if (filter === undefined || filter === null || filter === "")
        return null;

    // If it exists, make sure its data type is string
    if (typeof filter !== "string") {
        throw new AppError(`'${name}' must be a string`, 400);
    }

    // Remove leading and trailing whitespace
    const trimmedFilter = filter.trim();
    if (trimmedFilter === "") {
        return null;
    }

    return trimmedFilter;
}

// Validate integer data fields (page, limit, fromYear, toYear, minCitations)
export function parseInteger(filter, name) {
    if (filter === undefined || filter === null || filter === "")
        return null;

    // The number might be enclosed in a string, e.g,. "2"
    const parsedFilter = Number(filter);

    // If it's a number, make sure it's not a floating-point number
    if (!Number.isInteger(parsedFilter)) {
        throw new AppError(`'${name}' must be an integer`, 400);
    }

    return parsedFilter;
}

// Validate boolean data fields (isOpenAccess)
export function parseBoolean(filter, name) {
    if (filter === undefined || filter === null || filter === "")
        return null;

    if (filter === "true" || filter === true)
        return true;

    if (filter === "false" || filter === false)
        return false;

    // At this point, we certainly have an invalid non-boolean value
    throw new AppError(`'${name}' must be either true or false`, 400);
}

// Validate user ID
export function parseUserId(id) {
    if (!id || typeof id !== "number") {
        throw new AppError("Missing/Invalid user_id", 400);
    }

    const parsedId = parseInteger(id, "user_id");

    // Validate search history record id
    if (!parsedId || typeof parsedId !== "number") {
        throw new AppError("Missing/Invalid user_id", 400);
    }

    return parsedId;
}