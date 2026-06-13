const BLOCKS = [
  { name: 'Dirt',      color: '#8B6914', baseHits: 1,   pts: 1,   rarity: 0.20 },
  { name: 'Grass',     color: '#5a8c3e', baseHits: 1,   pts: 1,   rarity: 0.18 },
  { name: 'Sand',      color: '#d9c47a', baseHits: 1,   pts: 1,   rarity: 0.12 },
  { name: 'Wood',      color: '#a0714a', baseHits: 3,   pts: 2,   rarity: 0.10 },
  { name: 'Stone',     color: '#888888', baseHits: 6,   pts: 3,   rarity: 0.12 },
  { name: 'Coal',      color: '#333333', baseHits: 10,  pts: 5,   rarity: 0.09 },
  { name: 'Iron Ore',  color: '#c0896e', baseHits: 18,  pts: 10,  rarity: 0.07 },
  { name: 'Gold Ore',  color: '#d4af37', baseHits: 28,  pts: 20,  rarity: 0.05 },
  { name: 'Redstone',  color: '#cc2200', baseHits: 24,  pts: 15,  rarity: 0.04 },
  { name: 'Lapis',     color: '#1a3db5', baseHits: 24,  pts: 18,  rarity: 0.03 },
  { name: 'Emerald',   color: '#00b865', baseHits: 40,  pts: 40,  rarity: 0.02 },
  { name: 'Diamond',   color: '#4fc3f7', baseHits: 60,  pts: 75,  rarity: 0.015 },
  { name: '$GC Ore',   color: '#00ff88', baseHits: 120, pts: 250, rarity: 0.005 },
];

const PICKS = [
  { name: 'Wood',    cost: 0,      power: 1,   color: '#c8a060' },
  { name: 'Stone',   cost: 500,    power: 2,   color: '#aaaaaa' },
  { name: 'Iron',    cost: 2000,   power: 3.5, color: '#d4d4d4' },
  { name: 'Gold',    cost: 6000,   power: 5,   color: '#ffd700' },
  { name: 'Diamond', cost: 20000,  power: 9,   color: '#4fc3f7' },
  { name: '$GC',     cost: 75000,  power: 20,  color: '#00ff88' },
];

function generateWorld(cols, rows) {
  const world = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r < 2) { world.push(-1); continue; }

      const depth = r / rows;
      const roll = Math.random();
      let acc = 0, chosen = 0;

      for (let b = 0; b < BLOCKS.length; b++) {
        let weight = BLOCKS[b].rarity;
        if (b >= 6 && depth < 0.4) weight *= 0.1;
        if (b >= 10 && depth < 0.6) weight *= 0.05;
        if (b === 12 && depth < 0.75) weight *= 0;
        acc += weight;
        if (roll < acc) { chosen = b; break; }
        chosen = b;
      }

      if (r < 5) chosen = Math.min(chosen, 4);
      world.push(chosen);
    }
  }
  return world;
}

// Node.js export (server side)
if (typeof module !== 'undefined') {
  module.exports = { BLOCKS, PICKS, generateWorld };
}
