const fs = require('fs');
const path = require('path');

/**
 * Camada de persistência com dois modos:
 *  - MongoDB (quando MONGODB_URI está definida) → ideal para produção (Render/Vercel).
 *  - Arquivos JSON locais (fallback) → para desenvolvimento, sem precisar de banco.
 *
 * Modelo simples chave→valor: cada "chave" (modules, progress, tracker, financeiro)
 * é um documento único.
 */
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'nichole_study';
const FILE_DIR = path.join(__dirname, 'data', 'store');

let collection = null;
let mode = 'file';

async function connect() {
  if (MONGODB_URI) {
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    collection = client.db(DB_NAME).collection('appdata');
    mode = 'mongo';
    console.log('🗄️  Persistência: MongoDB');
  } else {
    fs.mkdirSync(FILE_DIR, { recursive: true });
    mode = 'file';
    console.log('🗄️  Persistência: arquivos locais (defina MONGODB_URI para usar banco)');
  }
}

async function load(key, fallback) {
  try {
    if (mode === 'mongo') {
      const doc = await collection.findOne({ _id: key });
      return doc ? doc.value : fallback;
    }
    const file = path.join(FILE_DIR, `${key}.json`);
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    console.error(`Erro ao carregar "${key}":`, err.message);
    return fallback;
  }
}

async function save(key, value) {
  try {
    if (mode === 'mongo') {
      await collection.updateOne({ _id: key }, { $set: { value } }, { upsert: true });
    } else {
      fs.writeFileSync(path.join(FILE_DIR, `${key}.json`), JSON.stringify(value, null, 2), 'utf8');
    }
  } catch (err) {
    console.error(`Erro ao salvar "${key}":`, err.message);
  }
}

module.exports = {
  connect,
  load,
  save,
  get mode() {
    return mode;
  },
};
