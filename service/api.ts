// @ts-nocheck

// Public backend (fallback for browser)
export const BackendLink = "https://finetic-ai.primedepthlabs.com";

// Check if running inside Electron
const isElectron = typeof window !== "undefined" && window.process?.type === "renderer";

// Use Electron protocol when in Electron, else use the deployed backend
export const localUrl = "http://localhost:9000"

/**
 * Generic API request function for Electron or Web
 * @param {string} url - Endpoint path (e.g., "/predict")
 * @param {string} method - HTTP method (e.g., 'GET', 'POST')
 * @param {string|Object|null} body - Payload for POST/PUT
 * @param {Object} headers - Custom headers
 * @param {string} contentType - MIME type (default 'application/json')
 * @param {string} responseType - Expected response type (e.g., 'json', 'text', 'xml')
 * @returns {Promise<any>} - API response
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
    const fullUrl = `${localUrl}${url}`;
    console.log("🔗 Requesting:", fullUrl);

    const defaultHeaders = {
      "Content-Type": contentType,
      ...headers,
    };

    const options = {
      method,
      headers: defaultHeaders,
    };

    if (body && method !== "GET") {
      if (contentType.includes("xml")) {
        options.body = typeof body === "string" ? body : body.toString();
      } else if (contentType.includes("json") && typeof body !== "string") {
        options.body = JSON.stringify(body);
      } else {
        options.body = body;
      }
    }

    const response = await fetch(fullUrl, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Error from API: ${response.status} ${response.statusText}\n${errorText}`
      );
    }

    switch (responseType.toLowerCase()) {
      case "json":
        return await response.json();
      case "text":
        return await response.text();
      case "xml":
        return await response.text(); // XML parsing can be done client-side
      default:
        return await response.json();
    }
  } catch (error) {
    console.error(`❌ API Error [${url}]:`, error);
    throw error;
  }
};
