import pool from '../server/db.js';

async function check() {
  try {
    const [rows] = await pool.query('SELECT * FROM site_content LIMIT 1');
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
