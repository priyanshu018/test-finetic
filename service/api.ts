// @ts-nocheck

// Deployed public backend for fallback
export const BackendLink = "https://finetic-ai.primedepthlabs.com";

// Check if running inside Electron
const isElectron = typeof window !== "undefined" && !!window.electronAPI;

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
    const targetUrl = isElectron ? url : `${BackendLink}${url}`;
    // console.log("📡 Requesting:", targetUrl, isElectron ? "[Electron]" : "[Web]");

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

    // Use Electron IPC if available
    const response = isElectron
      ? await window.electronAPI.proxyFetch(url, options)
      : await fetch(targetUrl, options).then((res) => {
          if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
          switch (responseType.toLowerCase()) {
            case "json":
              return res.json();
            case "text":
            case "xml":
              return res.text();
            default:
              return res.json();
          }
        });

    return response;
  } catch (error) {
    console.error(`❌ API Error [${url}]:`, error);
    throw error;
  }
};
