import axios from "axios";

/**
 * Shared SAP authentication service.
 *
 * Flow:
 *   1. POST { username, password } to SAP_LOGIN_URL.
 *   2. SAP returns a JWT bearer token.
 *   3. The token is cached in memory and reused by every SAP service.
 *   4. When the token is missing/expired (or a caller forces refresh),
 *      we log in again.
 *
 * Any SAP service can call getSapToken() to get a valid bearer token.
 */

let cachedToken = null;
let tokenExpiresAt = 0; // epoch ms; 0 means "unknown / not set"

// Log in a little before the real expiry to avoid edge-of-expiry failures.
const EXPIRY_SAFETY_MS = 60 * 1000; // 60s

/**
 * Extract the token string from the login response, tolerating a few
 * common response shapes (token / accessToken / access_token, optionally
 * nested under data).
 */
const extractToken = (body) => {
    if (!body) return null;
    return (
        body.token ||
        body.accessToken ||
        body.access_token ||
        body.data?.token ||
        body.data?.accessToken ||
        body.data?.access_token ||
        null
    );
};

/**
 * Best-effort read of token lifetime (seconds) from the login response.
 * Falls back to a default if SAP doesn't return one.
 */
const extractExpiresInSeconds = (body) => {
    const raw =
        body?.expiresIn ||
        body?.expires_in ||
        body?.data?.expiresIn ||
        body?.data?.expires_in;

    const seconds = Number(raw);
    if (Number.isFinite(seconds) && seconds > 0) return seconds;

    // Default assumption when SAP doesn't tell us: 1 hour.
    return 60 * 60;
};

/**
 * Perform the actual login call and cache the token.
 */
const login = async () => {
    const url = process.env.SAP_LOGIN_URL;
    if (!url) {
        throw new Error("SAP_LOGIN_URL is not configured in .env");
    }

    const response = await axios({
        method: "POST",
        url,
        data: {
            username: process.env.SAP_USERNAME,
            password: process.env.SAP_PASSWORD,
        },
        headers: { "Content-Type": "application/json" },
    });

    const token = extractToken(response.data);
    if (!token) {
        throw new Error("SAP login succeeded but no token was found in the response");
    }

    const expiresInSeconds = extractExpiresInSeconds(response.data);
    cachedToken = token;
    tokenExpiresAt = Date.now() + expiresInSeconds * 1000;

    console.log("[SAP Auth] Logged in, token cached.");
    return cachedToken;
};

const isTokenValid = () =>
    Boolean(cachedToken) && Date.now() < tokenExpiresAt - EXPIRY_SAFETY_MS;

/**
 * Get a valid SAP bearer token.
 * @param {boolean} forceRefresh - log in again even if a cached token exists.
 * @returns {Promise<string>} the bearer token
 */
export const getSapToken = async (forceRefresh = false) => {
    if (!forceRefresh && isTokenValid()) {
        return cachedToken;
    }
    return login();
};

/**
 * Convenience helper: returns an Authorization header object ready to spread
 * into an axios request, e.g. headers: { ...(await sapAuthHeader()) }.
 */
export const sapAuthHeader = async (forceRefresh = false) => {
    const token = await getSapToken(forceRefresh);
    return { Authorization: `Bearer ${token}` };
};

/**
 * Clear the cached token (e.g. after a 401) so the next call re-logs in.
 */
export const clearSapToken = () => {
    cachedToken = null;
    tokenExpiresAt = 0;
};
