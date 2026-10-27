import pool from "../../db/postgres.js";

/**
 * Add stock (weight) to a preform and propagate the change through every
 * downstream table that tracks that preform's remaining weight.
 *
 * Entire operation runs inside a single BEGIN/COMMIT transaction.
 *
 * Flow:
 *  1. Validate the preform exists in preform_data (else throw).
 *  2. Update mat_stock first: find the row by batch_id = preform_id and add
 *     adding_weight to both qty and balance_qty.
 *  3. If preform_data.is_active = true  -> just add adding_weight to preform_data.preform_weight.
 *  4. If preform_data.is_active = false -> look in preform_accept:
 *       - add adding_weight to preform_accept.preform_weight
 *       - if preform_accept.is_handle_join = true -> look in handle_join:
 *           - if handle_join.is_allocate = true -> look in preform_allocation:
 *               - if preform_allocation.preform_draw = false:
 *                   add adding_weight to balance_weight of every draw_entry row for this preform.
 *               - if preform_allocation.preform_draw = true:
 *                   add adding_weight to balance_weight of every draw_entry row for this preform
 *                   AND flip the row that has is_last = true to is_last = false.
 *
 * @param {Object} params
 * @param {string} params.preform_id    - Preform / batch identifier.
 * @param {number} params.adding_weight - Weight to add (positive number).
 * @param {string} [params.logged_in_user] - Employee id of the requester (for audit/future use).
 * @returns {Promise<Object>} Summary of what was updated.
 */
export const addPreformStockS = async ({ preform_id, adding_weight, logged_in_user }) => {
    // ── Basic input validation ──
    if (preform_id === undefined || preform_id === null || preform_id === "") {
        const error = new Error("preform_id is required.");
        error.statusCode = 400;
        throw error;
    }

    const addWeight = Number(adding_weight);
    if (adding_weight === undefined || adding_weight === null || adding_weight === "" || isNaN(addWeight) || addWeight <= 0) {
        const error = new Error("adding_weight must be a positive number.");
        error.statusCode = 400;
        throw error;
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // ── 1. Preform must exist in preform_data ──
        const preformResult = await client.query(
            `SELECT preform_id, preform_weight, is_active
             FROM preform_data
             WHERE preform_id = $1`,
            [preform_id]
        );

        if (preformResult.rows.length === 0) {
            const error = new Error("Preform not found in preform_data.");
            error.statusCode = 404;
            throw error;
        }

        const { is_active } = preformResult.rows[0];

        // Track what happened so the caller gets a clear summary.
        const summary = {
            preform_id,
            adding_weight: addWeight,
            is_active,
            mat_stock_updated: false,
            previous_qty: null,
            new_qty: null,
            previous_balance_qty: null,
            new_balance_qty: null,
            preform_data_updated: false,
            preform_accept_updated: false,
            is_handle_join: null,
            is_allocate: null,
            preform_draw: null,
            draw_entries_updated: 0,
            is_last_reset: false,
            preform_draw_reset: false,
        };

        // mat_stock update helper: find the row by batch_id = preform_id and add
        // adding_weight to qty + balance_qty. Shared by every branch.
        // Captures previous and new qty/balance_qty for the response.
        const updateMatStock = async () => {
            const matStockResult = await client.query(
                `UPDATE mat_stock
                 SET qty         = COALESCE(qty, 0) + $2,
                     balance_qty = COALESCE(balance_qty, 0) + $2,
                     updated_at  = CURRENT_TIMESTAMP
                 WHERE batch_id = $1
                 RETURNING qty, balance_qty`,
                [preform_id, addWeight]
            );

            if (matStockResult.rows.length === 0) {
                const error = new Error("Material stock (mat_stock) row not found for this preform.");
                error.statusCode = 404;
                throw error;
            }

            const newQty = Number(matStockResult.rows[0].qty);
            const newBalanceQty = Number(matStockResult.rows[0].balance_qty);

            summary.mat_stock_updated = true;
            // Previous values = new values minus the weight we just added.
            summary.previous_qty = newQty - addWeight;
            summary.new_qty = newQty;
            summary.previous_balance_qty = newBalanceQty - addWeight;
            summary.new_balance_qty = newBalanceQty;
        };

        // preform_data.preform_weight is ALWAYS updated, whether is_active is true or false.
        await client.query(
            `UPDATE preform_data
             SET preform_weight = COALESCE(preform_weight, 0) + $2
             WHERE preform_id = $1`,
            [preform_id, addWeight]
        );
        summary.preform_data_updated = true;

        // Active preform (is_active = true) is not in mat_stock yet, so only
        // preform_data is updated. Nothing else to do.
        if (is_active !== true) {
            // Inactive preform: update mat_stock first (same transaction).
            await updateMatStock();

            // ── 4. Inactive preform: it should live in preform_accept ──
            const acceptResult = await client.query(
                `SELECT preform_id, preform_weight, is_handle_join
                 FROM preform_accept
                 WHERE preform_id = $1`,
                [preform_id]
            );

            if (acceptResult.rows.length === 0) {
                const error = new Error("Preform is inactive but not found in preform_accept.");
                error.statusCode = 404;
                throw error;
            }

            const { is_handle_join } = acceptResult.rows[0];
            summary.is_handle_join = is_handle_join;

            // Add adding_weight to preform_accept.preform_weight
            await client.query(
                `UPDATE preform_accept
                 SET preform_weight = COALESCE(preform_weight, 0) + $2
                 WHERE preform_id = $1`,
                [preform_id, addWeight]
            );
            summary.preform_accept_updated = true;

            if (is_handle_join === true) {
                // ── Check handle_join.is_allocate ──
                const handleJoinResult = await client.query(
                    `SELECT is_allocate
                     FROM handle_join
                     WHERE preform_id = $1`,
                    [preform_id]
                );

                if (handleJoinResult.rows.length === 0) {
                    const error = new Error("handle_join row not found for this preform.");
                    error.statusCode = 404;
                    throw error;
                }

                const { is_allocate } = handleJoinResult.rows[0];
                summary.is_allocate = is_allocate;

                if (is_allocate === true) {
                    // ── Check preform_allocation.preform_draw ──
                    const allocationResult = await client.query(
                        `SELECT preform_draw
                         FROM preform_allocation
                         WHERE preform_id = $1`,
                        [preform_id]
                    );

                    if (allocationResult.rows.length === 0) {
                        const error = new Error("preform_allocation row not found for this preform.");
                        error.statusCode = 404;
                        throw error;
                    }

                    const { preform_draw } = allocationResult.rows[0];
                    summary.preform_draw = preform_draw;

                    // In both branches we add adding_weight to the balance_weight of
                    // every draw_entry row for this preform.
                    const drawUpdateResult = await client.query(
                        `UPDATE draw_entry
                         SET balance_weight = COALESCE(balance_weight, 0) + $2
                         WHERE preform_id = $1`,
                        [preform_id, addWeight]
                    );
                    summary.draw_entries_updated = drawUpdateResult.rowCount;

                    if (preform_draw === true) {
                        // Preform draw already completed -> reopen it by flipping
                        // the last draw entry (is_last = true) back to false.
                        const resetResult = await client.query(
                            `UPDATE draw_entry
                             SET is_last = false
                             WHERE preform_id = $1
                               AND is_last = true`,
                            [preform_id]
                        );
                        summary.is_last_reset = resetResult.rowCount > 0;

                        // Also set preform_allocation.preform_draw back to false and
                        // clear the tower (tower_no = 0), only in this case.
                        await client.query(
                            `UPDATE preform_allocation
                             SET preform_draw = false,
                                 tower_no = 0
                             WHERE preform_id = $1`,
                            [preform_id]
                        );
                        summary.preform_draw_reset = true;
                    }
                }
            }
        }

        await client.query("COMMIT");

        return {
            success: true,
            message: "Preform stock added successfully.",
            ...summary,
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
