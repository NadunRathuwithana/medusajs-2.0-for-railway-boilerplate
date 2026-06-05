const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres:password@127.0.0.1:5432/cardle_db' });
client.connect().then(async () => {
  const geoId = 'fgz_' + Math.random().toString(36).substring(2, 15);
  await client.query(`
    INSERT INTO geo_zone (id, type, country_code, service_zone_id, created_at, updated_at) 
    VALUES ($1, 'country', 'lk', 'serzo_01KTBN20Q8AJHVWSC5M89TC25B', NOW(), NOW())
  `, [geoId]);
  console.log('Inserted lk into geo_zone!');
  process.exit();
}).catch(console.error);
