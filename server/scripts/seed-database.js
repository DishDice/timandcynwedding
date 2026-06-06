import { populateDefaultsIfEmpty } from '../seedData.js';
import { getDbInfo } from '../db.js';

const populated = populateDefaultsIfEmpty();
const info = getDbInfo();

console.log(`[seed] Database: ${info.path}`);
console.log(`[seed] Records: ${info.records}`);
console.log(`[seed] Populated: ${populated.length ? populated.join(', ') : 'nothing (collections already had data)'}`);
