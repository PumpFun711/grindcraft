const SKIN_COLORS  = ['#f4b07a','#d4956a','#c07840','#8b5e3c','#5a3620','#fddbb4'];
const HAIR_COLORS  = ['#3b2314','#7b4f1f','#d4b483','#c0c0c0','#111111','#cc2222','#4444cc','#00cc88'];
const SHIRT_COLORS = ['#3a6bc7','#c73a3a','#3ac76b','#c7973a','#8b3ac7','#333333','#ffffff','#1a7a7a'];
const PANTS_COLORS = ['#2a3a6e','#2a2a2a','#5a3020','#1a5a3a','#4a4a4a','#3a2a5a'];

function shadeColor(hex, amt) {
  let r = parseInt(hex.slice(1,3),16);
  let g = parseInt(hex.slice(3,5),16);
  let b = parseInt(hex.slice(5,7),16);
  r = Math.max(0, Math.min(255, r + amt));
  g = Math.max(0, Math.min(255, g + amt));
  b = Math.max(0, Math.min(255, b + amt));
  return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
}

// Draw a pixel art character sprite onto a canvas context
// cx, cy = top-left position, S = pixel scale size, walkFrame = 0 or 1
function drawPixelChar(ctx, cx, cy, preset, walkFrame, S) {
  const f = walkFrame % 2;

  function px(col, row, w, h, color, alpha) {
    if (alpha !== undefined) ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(cx + col*S, cy + row*S, w*S, h*S);
    if (alpha !== undefined) ctx.globalAlpha = 1;
  }

  // Shadow
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(cx + 4*S, cy + 18*S, 4.5*S, 1.5*S, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Hair top
  px(1, 0, 6, 1, preset.hair);
  px(0, 1, 8, 1, preset.hair);

  // Head / face
  px(1, 1, 6, 5, preset.skin);
  px(0, 1, 1, 4, preset.hair); // left side hair
  px(7, 1, 1, 4, preset.hair); // right side hair

  // Eyes
  px(2, 3, 1, 1, '#1a0a00');
  px(5, 3, 1, 1, '#1a0a00');
  // Eye shine
  px(2, 3, 1, 1, '#ffffff', 0.3);

  // Mouth
  px(3, 5, 2, 1, '#7a2a2a');

  // Ears
  px(0, 3, 1, 2, preset.skin);
  px(7, 3, 1, 2, preset.skin);

  // Neck
  px(3, 6, 2, 1, preset.skin);

  // Torso
  px(1, 7, 6, 5, preset.shirt);
  // Shirt collar
  px(3, 7, 2, 1, shadeColor(preset.shirt, 30));
  // Shirt shadow line
  px(3, 8, 2, 1, shadeColor(preset.shirt, -20));

  // Arms — swing with walk
  const armOff = f === 0 ? 0 : 1;
  px(0, 7, 1, 5, preset.skin);
  px(0, 7 + armOff, 1, 1, shadeColor(preset.skin, -15));
  px(7, 7, 1, 5, preset.skin);
  px(7, 7 + (1 - armOff), 1, 1, shadeColor(preset.skin, -15));

  // Pickaxe in right hand
  px(8, 8, 3, 1, '#a07840');   // handle
  px(10, 7, 1, 1, '#aaaaaa');  // pickaxe head top
  px(11, 7, 1, 2, '#888888');  // pickaxe head

  // Belt
  px(1, 12, 6, 1, shadeColor(preset.pants, 50));
  px(3, 12, 2, 1, '#b89040'); // buckle

  // Legs — alternate with walk
  const legOff = f === 0 ? 0 : 1;
  px(1, 13, 3, 5, preset.pants);
  px(4, 13, 3, 5, preset.pants);
  if (legOff) {
    px(1, 14, 2, 1, shadeColor(preset.pants, -25));
  } else {
    px(5, 14, 2, 1, shadeColor(preset.pants, -25));
  }

  // Boots
  px(1, 18, 3, 2, '#2a1a0a');
  px(4, 18, 3, 2, '#2a1a0a');
  // Boot highlight
  px(1, 18, 3, 1, '#4a3020');
  px(4, 18, 3, 1, '#4a3020');
}

// Draw name tag above character
function drawNameTag(ctx, cx, cy, name, isMe, S) {
  const charH = 20 * S;
  const fontSize = Math.max(9, S * 4);
  ctx.font = `bold ${fontSize}px 'Courier New', monospace`;
  const tw = ctx.measureText(name).width;

  ctx.globalAlpha = 0.65;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(cx + 4*S - tw/2 - 4, cy - charH - 4, tw + 8, fontSize + 4);
  ctx.globalAlpha = 1;

  ctx.fillStyle = isMe ? '#00ff88' : '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(name, cx + 4*S, cy - charH + fontSize - 2);
  ctx.textAlign = 'left';
}

// Build color picker buttons
function buildColorPicker(containerId, colors, onSelect) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '';
  colors.forEach((c, i) => {
    const btn = document.createElement('button');
    btn.className = 'color-btn' + (i === 0 ? ' active' : '');
    btn.style.background = c;
    btn.title = c;
    btn.onclick = () => {
      el.querySelectorAll('.color-btn').forEach((b, j) => b.classList.toggle('active', j === i));
      onSelect(c);
    };
    el.appendChild(btn);
  });
}
