import { getBobbinLabelsS, VALID_PATTERNS } from "../../../services/bobbin_label/bobbin_label.service.js";

// POST /api/bobbin/labels
// Body: { bobbin_nos: string[], pattern: 1|2|3 }
// Returns label/sticker data for a batch of bobbins.
export const getBobbinLabelsC = async (req, res) => {
    try {
        const { bobbin_nos, pattern } = req.body || {};

        // ── Validation ──────────────────────────────────────────────────────
        if (!Array.isArray(bobbin_nos) || bobbin_nos.length === 0) {
            return res.status(400).json({ success: false, message: "bobbin_nos must be a non-empty array" });
        }

        // Normalise defensively (frontend already trims + de-dupes, but validate server-side).
        const cleaned = [...new Set(
            bobbin_nos
                .filter((b) => typeof b === "string")
                .map((b) => b.trim())
                .filter((b) => b.length > 0)
        )];

        if (cleaned.length === 0) {
            return res.status(400).json({ success: false, message: "bobbin_nos must contain at least one valid bobbin number" });
        }

        const patternNum = Number(pattern);
        if (!Number.isInteger(patternNum) || !VALID_PATTERNS.includes(patternNum)) {
            return res.status(400).json({ success: false, message: "Invalid pattern" });
        }

        // ── Fetch ───────────────────────────────────────────────────────────
        const data = await getBobbinLabelsS(cleaned, patternNum);

        // None found -> success with empty data (frontend handles this as "no records").
        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error("Bobbin Labels Error:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};
