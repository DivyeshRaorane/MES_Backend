/**
 * SAP Transaction Auto-Generation Service
 *
 * Called by Draw Entry service after a successful draw entry insert.
 * Uses the SAME transaction client — never manages its own BEGIN/COMMIT/ROLLBACK.
 */

/**
 * Generate SAP Transactions after a successful Draw Entry.
 *
 * @param {Object} drawEntryData - Data from the Draw Entry
 * @param {string} drawEntryData.spool_id - Spool ID (used as batch for finished goods)
 * @param {string} drawEntryData.product_type - e.g. "G652D"
 * @param {string} drawEntryData.process_type - e.g. "250"
 * @param {number} drawEntryData.produced_km - Produced length in KM
 * @param {string} drawEntryData.preform_batch - Preform batch selected during draw entry
 * @param {string} drawEntryData.primary_coating_batch - Primary coating batch
 * @param {string} drawEntryData.secondary_coating_batch - Secondary coating batch
 
 * @param {Object} client - PostgreSQL transaction client (from pool.connect())
 * @returns {Object} { transaction_no, process_order_no, finished_material, produced_km, components_count }
 */
export async function generateSAPTransactions(drawEntryData, client) {
    const {
        spool_id,
        product_type,
        process_type,
        produced_km,
        preform_batch,
        primary_coating_batch,
        secondary_coating_batch
    } = drawEntryData;

    console.log(
    "Process:", process_type
    )

    // ─── Step 1: Determine Finished Material ───
    const finishedMaterial = `DT${(product_type || '').trim()}${(process_type || '')}`;
    
    // ─── Step 2: Find Active Process Order ───
    const processOrder = await findActiveProcessOrder(finishedMaterial, client);

    // ─── Step 3: Load BOM ───
    const bomComponents = await loadBOM(finishedMaterial, client);

    // ─── Step 4: Produced Quantity ───
    const producedKm = parseFloat(produced_km);
    if (!producedKm || producedKm <= 0) {
        throw new Error('Produced KM must be greater than zero');
    }

    // ─── Step 5: Calculate Consumption for each component ───
    const consumptions = bomComponents.map(comp => ({
        component_material_code: comp.component_material_code,
        consume_qty: parseFloat((producedKm * parseFloat(comp.consume_qty_per_km)).toFixed(3)),
    }));

    // ─── Step 6: Generate Transaction Number ───
    const transactionNo = generateTransactionNumber();
   
    // ─── Step 7: Fetch material details for all materials ───
    const allMaterialCodes = [finishedMaterial, ...bomComponents.map(c => c.component_material_code)];
    const materialDetails = await fetchMaterialDetails(allMaterialCodes, client);

    // ─── Step 8: Insert Finished Goods Transaction (Movement Type 101) ───
    const fgMaterial = materialDetails[finishedMaterial];

    await client.query(`
        INSERT INTO sap_transaction
        (transaction_no, process_order_no, material_code, material_description,
         plant, storage_location, movement_type, quantity, uom, batch,
         posting_date, sap_status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_DATE, 'PENDING')
    `, [
        transactionNo,
        processOrder.process_o_no,
        finishedMaterial,
        fgMaterial?.material_description || null,
        '1200',
        '1204',
        '101',
        producedKm,
        fgMaterial?.uom || 'KM',
        spool_id
        
    ]);

    // ─── Step 9: Insert Consumption Transactions (Movement Type 261) ───
    for (const consumption of consumptions) {
        const compMaterial = materialDetails[consumption.component_material_code];

        const batch = determineBatch(consumption.component_material_code, compMaterial, {
            preform_batch,
            primary_coating_batch,
            secondary_coating_batch,
        });

        await client.query(`
            INSERT INTO sap_transaction
            (transaction_no, process_order_no, material_code, material_description,
             plant, storage_location, movement_type, quantity, uom, batch,
             posting_date, sap_status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_DATE, 'PENDING')
        `, [
            transactionNo,
            processOrder.process_o_no,
            consumption.component_material_code,
            compMaterial?.material_description || null,
            '1200',
            '1204',
            '261',
            consumption.consume_qty,
            compMaterial?.uom || null,
            batch,
        ]);

        // Update process_order_materials consumed/balance tracking
        await client.query(`
            UPDATE process_order
            SET 
                balance_qty = balance_qty - $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE process_o_no = $2 AND material_code = $3
        `, [consumption.consume_qty, processOrder.process_o_no, consumption.component_material_code]);
    }
    // ─── Step 10: Update Process Order Balance for Finished Material only ───
    await client.query(`
        UPDATE process_order
        SET balance_qty = balance_qty - $1, updated_at = CURRENT_TIMESTAMP
        WHERE process_o_no = $2 AND material_code = $3
    `, [producedKm, processOrder.process_o_no, finishedMaterial]);

    // ─── Step 11: Close individual rows if their balance reaches zero ───
    await client.query(`
        UPDATE process_order
        SET balance_qty = 0, is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE process_o_no = $1 AND material_code = $2 AND balance_qty <= 0
    `, [processOrder.process_o_no, finishedMaterial]);

    // Also close component rows whose balance reached zero (from Step 9 deductions)
    for (const consumption of consumptions) {
        await client.query(`
            UPDATE process_order
            SET balance_qty = 0, is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE process_o_no = $1 AND material_code = $2 AND balance_qty <= 0
        `, [processOrder.process_o_no, consumption.component_material_code]);
    }

    
    return {
        transaction_no: transactionNo,
        process_order_no: processOrder.process_o_no,
        finished_material: finishedMaterial,
        produced_km: producedKm,
        components_count: consumptions.length,
    };
}

/* ══════════════════════════════════════════════════════════
   HELPER FUNCTIONS
   ══════════════════════════════════════════════════════════ */

/**
 * Find the active Process Order for a finished material.
 * Throws if not found.
 */
async function findActiveProcessOrder(materialCode, client) {
    const result = await client.query(
        'SELECT * FROM process_order WHERE material_code = $1 AND is_active = true LIMIT 1',
        [materialCode]
    );

    if (result.rows.length === 0) {
        throw new Error(`No active Process Order found for material: ${materialCode}`);
    }

    return result.rows[0];
}

/**
 * Load BOM components for a finished material.
 * Throws if BOM is empty or not found.
 */
async function loadBOM(materialCode, client) {
    const result = await client.query(
        'SELECT * FROM bom_master WHERE material_code = $1 AND is_active = true',
        [materialCode]
    );

    if (result.rows.length === 0) {
        throw new Error(`BOM not found for material: ${materialCode}`);
    }

    return result.rows;
}

/**
 * Generate a unique Transaction Number.
 * Format: DT + YYYYMMDDHHMMSSmmm (timestamp with milliseconds)
 */
function generateTransactionNumber() {
    const now = new Date();
    const pad = (n, len = 2) => String(n).padStart(len, '0');
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${pad(now.getMilliseconds(), 3)}`;
    return `DT${timestamp}`;
}

/**
 * Fetch material details (description, uom) for multiple material codes.
 * Returns a map: { material_code: { material_description, uom, material_category } }
 */
async function fetchMaterialDetails(materialCodes, client) {
    if (materialCodes.length === 0) return {};

    const placeholders = materialCodes.map((_, i) => `$${i + 1}`).join(', ');
    const result = await client.query(
        `SELECT material_code, material_description, uom, material_category
         FROM material_master WHERE material_code IN (${placeholders})`,
        materialCodes
    );

    const map = {};
    for (const row of result.rows) {
        map[row.material_code] = row;
    }
    return map;
}

/**
 * Determine the batch for a component based on material category/description.
 *
 * Rules:
 * - Fiber Preform → use preform_batch from Draw Entry
 * - Primary Coating → use primary_coating_batch from Draw Entry
 * - Secondary Coating → use secondary_coating_batch from Draw Entry
 * - Gas Materials (Liquid Nitrogen, Helium, Carbon Dioxide, Liquid Argon) → NULL
 */
function determineBatch(componentCode, materialInfo, batches) {
    if (!materialInfo) return null;

    const desc = (materialInfo.material_description || '').toUpperCase();

    // Fiber Preform
    if (desc.includes('PREFORM') || desc.includes('FIBER PREFORM')) {
        return batches.preform_batch || null;
    }

    // Primary Coating
    if ((desc.includes('PRI') && desc.includes('COAT')) || desc.includes('PRIMARY COAT')) {
        return batches.primary_coating_batch || null;
    }

    // Secondary Coating
    if ((desc.includes('SEC') && desc.includes('COAT')) || desc.includes('SECONDARY COAT')) {
        return batches.secondary_coating_batch || null;
    }

    // Gas Materials - batch is NULL
    const gasMaterials = ['NITROGEN', 'HELIUM', 'CARBON DIOXIDE', 'ARGON'];
    for (const gas of gasMaterials) {
        if (desc.includes(gas)) {
            return null;
        }
    }

    // Default: NULL (unknown materials)
    return null;
}
