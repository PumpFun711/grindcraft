const SKIN_COLORS  = ['#f4b07a','#d4956a','#c07840','#8b5e3c','#5a3620','#fddbb4'];
const HAIR_COLORS  = ['#3b2314','#7b4f1f','#d4b483','#c0c0c0','#111111','#cc2222','#4444cc','#00cc88'];
const SHIRT_COLORS = ['#3a6bc7','#c73a3a','#3ac76b','#c7973a','#8b3ac7','#333333','#ffffff','#1a7a7a'];
const PANTS_COLORS = ['#2a3a6e','#2a2a2a','#5a3020','#1a5a3a','#4a4a4a','#3a2a5a'];

function shadeColor(hex, amt) {
  let r = parseInt(hex.slice(1,3),16);
  let g = parseInt(hex.slice(3,5),16);
  let b = parseInt(hex.slice(5,7),16);
  r = Math.max(0,Math.min(255,r+amt));
  g = Math.max(0,Math.min(255,g+amt));
  b = Math.max(0,Math.min(255,b+amt));
  return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
}

// Direction: 0=down, 1=left, 2=right, 3=up
function drawPixelChar(ctx, cx, cy, preset, walkFrame, S, direction) {
  const f = walkFrame % 4;
  direction = direction || 0;

  function px(col, row, w, h, color, alpha) {
    if(alpha !== undefined) ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(cx+col*S, cy+row*S, w*S, h*S);
    if(alpha !== undefined) ctx.globalAlpha = 1;
  }

  // Shadow
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(cx+4*S, cy+19*S, 5*S, 2*S, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Walk offsets for legs
  const legL = (f === 1) ? -1 : (f === 3) ? 1 : 0;
  const legR = (f === 1) ? 1 : (f === 3) ? -1 : 0;
  const armL = (f === 1) ? 1 : (f === 3) ? -1 : 0;
  const armR = (f === 1) ? -1 : (f === 3) ? 1 : 0;
  const bob  = (f === 0 || f === 2) ? 0 : -1;

  if(direction === 3) {
    // Facing UP — draw back of head
    px(1,0+bob, 6,1, preset.hair);
    px(0,1+bob, 8,5, preset.hair);
    px(1,1+bob, 6,5, shadeColor(preset.skin,-10));
    // Torso
    px(1,6+bob, 6,5, preset.shirt);
    px(0,7+bob+armL, 1,4, preset.skin);
    px(7,7+bob+armR, 1,4, preset.skin);
    // Legs
    px(1,11+bob, 3,6, preset.pants);
    px(4,11+bob, 3,6, preset.pants);
    px(1,11+legL+bob, 3,1, shadeColor(preset.pants,20));
    px(4,11+legR+bob, 3,1, shadeColor(preset.pants,20));
    // Boots
    px(1,17+bob, 3,2, '#2a1a0a');
    px(4,17+bob, 3,2, '#2a1a0a');

  } else if(direction === 1) {
    // Facing LEFT
    px(1,0+bob, 5,1, preset.hair);
    px(1,1+bob, 5,5, preset.skin);
    px(0,1+bob, 1,5, preset.hair);
    px(5,1+bob, 2,5, shadeColor(preset.skin,-20));
    // Eye
    px(2,3+bob, 1,1, '#1a0a00');
    px(2,3+bob, 1,1, '#ffffff', 0.3);
    // Mouth
    px(2,5+bob, 2,1, '#7a2a2a');
    // Ear
    px(6,3+bob, 1,2, preset.skin);
    // Neck
    px(3,6+bob, 2,1, preset.skin);
    // Torso
    px(1,7+bob, 5,5, preset.shirt);
    px(6,7+bob, 1,5, shadeColor(preset.shirt,-20));
    // Arms
    px(0,7+bob+armL, 1,5, preset.skin);
    px(7,7+bob+armR, 1,5, shadeColor(preset.skin,-15));
    // Pickaxe
    px(-2,8+bob, 2,1, '#a07840');
    px(-3,7+bob, 1,2, '#aaaaaa');
    // Legs
    px(1,12+bob, 3,6, preset.pants);
    px(4,12+bob, 2,6, shadeColor(preset.pants,-15));
    px(1,12+legL+bob, 2,2, shadeColor(preset.pants,20));
    // Boots
    px(1,18+bob, 6,2, '#2a1a0a');
    px(1,18+bob, 6,1, '#4a3020');

  } else if(direction === 2) {
    // Facing RIGHT
    px(2,0+bob, 5,1, preset.hair);
    px(2,1+bob, 5,5, preset.skin);
    px(7,1+bob, 1,5, preset.hair);
    px(0,1+bob, 2,5, shadeColor(preset.skin,-20));
    // Eye
    px(5,3+bob, 1,1, '#1a0a00');
    px(5,3+bob, 1,1, '#ffffff', 0.3);
    // Mouth
    px(4,5+bob, 2,1, '#7a2a2a');
    // Ear
    px(1,3+bob, 1,2, preset.skin);
    // Neck
    px(3,6+bob, 2,1, preset.skin);
    // Torso
    px(2,7+bob, 5,5, preset.shirt);
    px(1,7+bob, 1,5, shadeColor(preset.shirt,-20));
    // Arms
    px(7,7+bob+armR, 1,5, preset.skin);
    px(0,7+bob+armL, 1,5, shadeColor(preset.skin,-15));
    // Pickaxe
    px(8,8+bob, 2,1, '#a07840');
    px(10,7+bob, 1,2, '#aaaaaa');
    // Legs
    px(4,12+bob, 3,6, preset.pants);
    px(2,12+bob, 2,6, shadeColor(preset.pants,-15));
    px(4,12+legR+bob, 2,2, shadeColor(preset.pants,20));
    // Boots
    px(1,18+bob, 6,2, '#2a1a0a');
    px(1,18+bob, 6,1, '#4a3020');

  } else {
    // Facing DOWN (default/front)
    // Hair
    px(1,0+bob, 6,1, preset.hair);
    px(0,1+bob, 8,1, preset.hair);
    // Head
    px(1,1+bob, 6,5, preset.skin);
    px(0,1+bob, 1,4, preset.hair);
    px(7,1+bob, 1,4, preset.hair);
    // Eyes
    px(2,3+bob, 1,1, '#1a0a00');
    px(5,3+bob, 1,1, '#1a0a00');
    px(2,3+bob, 1,1, '#ffffff', 0.25);
    // Mouth
    px(3,5+bob, 2,1, '#7a2a2a');
    // Ears
    px(0,3+bob, 1,2, preset.skin);
    px(7,3+bob, 1,2, preset.skin);
    // Neck
    px(3,6+bob, 2,1, preset.skin);
    // Torso
    px(1,7+bob, 6,5, preset.shirt);
    px(3,7+bob, 2,1, shadeColor(preset.shirt,30));
    px(3,8+bob, 2,4, shadeColor(preset.shirt,-15));
    // Arms swing
    px(0,7+bob+armL, 1,5, preset.skin);
    px(7,7+bob+armR, 1,5, preset.skin);
    // Belt
    px(1,12+bob, 6,1, shadeColor(preset.pants,40));
    px(3,12+bob, 2,1, '#b89040');
    // Legs
    px(1,13+bob, 3,5, preset.pants);
    px(4,13+bob, 3,5, preset.pants);
    px(1,13+legL+bob, 2,2, shadeColor(preset.pants,20));
    px(4,13+legR+bob, 2,2, shadeColor(preset.pants,20));
    // Boots
    px(1,18+bob, 3,2, '#2a1a0a');
    px(4,18+bob, 3,2, '#2a1a0a');
    px(1,18+bob, 3,1, '#4a3020');
    px(4,18+bob, 3,1, '#4a3020');
  }
}

function drawNameTag(ctx, cx, cy, name, isMe, S) {
  const charH = 20*S;
  const fontSize = Math.max(10, S*4);
  ctx.font = `bold ${fontSize}px 'Courier New',monospace`;
  const tw = ctx.measureText(name).width;
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(cx+4*S-tw/2-5, cy-charH-6, tw+10, fontSize+4);
  ctx.globalAlpha = 1;
  ctx.fillStyle = isMe ? '#00ff88' : '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(name, cx+4*S, cy-charH+fontSize-2);
  ctx.textAlign = 'left';
}

function buildColorPicker(containerId, colors, onSelect) {
  const el = document.getElementById(containerId);
  if(!el) return;
  el.innerHTML = '';
  colors.forEach((c,i) => {
    const btn = document.createElement('button');
    btn.className = 'color-btn'+(i===0?' active':'');
    btn.style.background = c;
    btn.title = c;
    btn.onclick = () => {
      el.querySelectorAll('.color-btn').forEach((b,j) => b.classList.toggle('active', j===i));
      onSelect(c);
    };
    el.appendChild(btn);
  });
}
