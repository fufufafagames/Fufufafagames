
const { pool } = require('./config/database');

async function checkColumn() {
    try {
        const res = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='games' AND column_name='icon_url';
        `);
        if (res.rows.length > 0) {
            console.log("✅ Column 'icon_url' EXISTS in table 'games'.");
        } else {
            console.log("❌ Column 'icon_url' MISSING in table 'games'.");
        }
    } catch (err) {
        console.error("Error checking column:", err);
    } finally {
        process.exit();
    }
}

checkColumn();
