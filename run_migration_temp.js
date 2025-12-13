
const runMigration = require('./utils/migrator');
const { pool } = require('./config/database');

// Run migration
runMigration()
    .then(() => {
        console.log('Done.');
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
