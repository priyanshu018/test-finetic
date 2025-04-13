// Option 1: If your API service is running locally
export const BackendLink = "https://fineticai-881756922441.us-central1.run.app"
// export const BackendLink = "https://fbe1-223-178-209-121.ngrok-free.app"
export const localUrl = "http://localhost:9000"


/**
 * Generic API request function for Electron
 * @param {string} url - The endpoint URL
 * @param {string} method - The HTTP method (e.g., 'GET', 'POST', etc.)
 * @param {string|Object} [body] - The request payload for POST/PUT requests
 * @param {Object} [headers] - Optional headers to customize the request
 * @param {string} [contentType] - Content type of the request (e.g., 'application/json', 'application/xml')
 * @param {string} [responseType] - Expected response type (e.g., 'json', 'text', 'xml')
 * @returns {Promise<Object|string>} - Returns a Promise with the API response
 */
export const apiRequest = async (
    url,
    method,
    body = null,
    headers = {},
    contentType = "application/json",
    responseType = "json"
) => {
    try {
        // Default headers with specified content type
        const defaultHeaders = {
            "Content-Type": contentType,
            ...headers,
        };

        // Options for fetch
        const options = {
            method,
            headers: defaultHeaders,
        };

        // Determine which base URL to use - for Electron apps, you might need
        // to handle this differently based on development vs production
        const fullUrl = localUrl + url;
        
        console.log("Making request to:", fullUrl);

        // Add body to the request if it's not a GET request
        if (body && method !== "GET") {
            // If content type is XML, send the body as is (assuming it's already XML string)
            // Otherwise, JSON stringify if it's an object
            if (contentType.includes("xml")) {
                options.body = typeof body === 'string' ? body : body.toString();
            } else if (contentType.includes("json") && typeof body !== 'string') {
                options.body = JSON.stringify(body);
            } else {
                options.body = body;
            }
        }

        // Fetch the response from the given URL
        const response = await fetch(fullUrl, options);
        
        // Check if the response is okay (status in the range 200-299)
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `Error from API request: ${response.status} ${response.statusText}\n${errorText}`
            );
        }
        
        // Parse the response based on the responseType
        let data;
        switch (responseType.toLowerCase()) {
            case 'json':
                data = await response.json();
                break;
            case 'text':
                data = await response.text();
                break;
            case 'xml':
                const text = await response.text();
                // You might want to use a proper XML parser here
                data = text;
                break;
            default:
                data = await response.json();
        }
        
        return data;
    } catch (error) {
        // Handle errors and log them
        console.error("API Error for", url, ":", error);
        throw error; // Re-throw error for further handling
    }
};