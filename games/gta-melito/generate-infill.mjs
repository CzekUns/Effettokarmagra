/* Original synthetic art cache; regenerate whenever the generator or map changes.
 * Run: node games/gta-melito/generate-infill.mjs */
import {readFile,writeFile} from 'node:fs/promises';
import {generateUrbanInfill,INFILL_VERSION,mapFingerprint} from './urban-infill.mjs';
const map=JSON.parse(await readFile(new URL('./data/melito-map.json',import.meta.url),'utf8'));
const infill=generateUrbanInfill(map);
await writeFile(new URL('./data/urban-infill.json',import.meta.url),JSON.stringify({
 schema:1,generatorVersion:INFILL_VERSION,sourceCreated:map.created,
 sourceFingerprint:mapFingerprint(map),
 sourceOsmBuildings:map.buildings.length,...infill
})+'\n');
console.log(`Cached ${infill.buildings.length} synthetic placeholders (not surveyed buildings).`);
