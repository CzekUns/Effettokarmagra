#!/usr/bin/env node
/* One-shot OpenStreetMap snapshot for GTA Melito.
 * Run from repository root: node scripts/build-melito-map.mjs
 * Source: © OpenStreetMap contributors, Open Database License (ODbL).
 * Boundary: ISTAT 2026, CC BY. Do not fetch Google Maps tiles.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {getProjection,fetchOverpass} from '../games/gta-melito/osm.mjs';
const file='games/gta-melito/data/melito-map.json';
const boundary=JSON.parse(await readFile('games/gta-melito/data/boundary.json','utf8'));
const p=getProjection(boundary);
console.log('Melito di Napoli: extent',p.width,'x',p.height,'metres; retrieving OSM ways...');
try{
 const map=await fetchOverpass(boundary,url=>console.log('Trying',url));
 const drive=map.roads.filter(r=>!['pedestrian','path','footway','cycleway','steps'].includes(r.t));
 if(map.roads.length<60||drive.length<40||map.buildings.length<50)throw Error('Suspiciously incomplete extraction: '+map.roads.length+' roads, '+map.buildings.length+' buildings');
 await mkdir('games/gta-melito/data',{recursive:true});
 await writeFile(file,JSON.stringify(map),'utf8');
 console.log('Wrote',file,':',map.roads.length,'roads,',map.buildings.length,'buildings,',map.pois.length,'POI');
 console.log('OSM roads examples:',map.roads.filter(x=>x.n).slice(0,12).map(x=>x.n).join(' · '));
}catch(error){
 console.error('OSM import failed: '+error.message);
 process.exitCode=1;
}
