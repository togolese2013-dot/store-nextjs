const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function runMigration() {
  console.log('🔧 Exécution de la migration pour la table produits_liés...');
  
  // Configuration de la connexion (identique à lib/db.ts)
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'togol2600657',
    charset: 'utf8mb4',
  });

  try {
    // Lire le fichier SQL
    const sqlPath = path.join(__dirname, 'related-products-migration.sql');
    const sql = await fs.readFile(sqlPath, 'utf8');
    
    console.log('📄 Contenu SQL :');
    console.log(sql);
    console.log('\n🚀 Exécution de la migration...');
    
    // Exécuter la migration
    const connection = await pool.getConnection();
    try {
      await connection.query(sql);
      console.log('✅ Migration exécutée avec succès !');
      console.log('✅ Table "produits_liés" créée.');
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration :', error.message);
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('ℹ️ La table existe déjà, pas de problème.');
    }
  } finally {
    await pool.end();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  runMigration().catch(console.error);
}

module.exports = { runMigration };