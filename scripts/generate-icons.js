const fs = require('fs');
const path = require('path');

// ChatWave brand colors (from the landing page gradient)
// rose-500: #f43f5e, indigo-600: #4f46e5

function generateSVGIcon(size) {
  const pad = size * 0.05;
  const r = size * 0.18; // corner radius

  // Chat bubble dimensions (main)
  const bx = size * 0.12;
  const by = size * 0.18;
  const bw = size * 0.55;
  const bh = size * 0.36;
  const br = size * 0.06;

  // Chat bubble tail
  const tx1 = bx + size * 0.06;
  const ty1 = by + bh;
  const tx2 = bx;
  const ty2 = by + bh + size * 0.1;
  const tx3 = bx + size * 0.16;
  const ty3 = by + bh;

  // Small reply bubble
  const sx = size * 0.38;
  const sy = size * 0.50;
  const sw = size * 0.50;
  const sh = size * 0.22;
  const sr = size * 0.05;

  // Reply bubble tail
  const stx1 = sx + sw - size * 0.06;
  const sty1 = sy + sh;
  const stx2 = sx + sw;
  const sty2 = sy + sh + size * 0.08;
  const stx3 = sx + sw - size * 0.16;
  const sty3 = sy + sh;

  // Dots for typing indicator in main bubble
  const dotR = size * 0.025;
  const dotY = by + bh * 0.5;
  const dot1X = bx + bw * 0.3;
  const dot2X = bx + bw * 0.5;
  const dot3X = bx + bw * 0.7;

  // Lines in reply bubble
  const lineY1 = sy + sh * 0.42;
  const lineY2 = sy + sh * 0.65;
  const lineX1 = sx + sw * 0.15;
  const lineX2a = sx + sw * 0.85;
  const lineX2b = sx + sw * 0.6;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f43f5e"/>
      <stop offset="100%" stop-color="#4f46e5"/>
    </linearGradient>
    <linearGradient id="bubble1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.95)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0.85)"/>
    </linearGradient>
    <linearGradient id="bubble2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.30)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0.18)"/>
    </linearGradient>
  </defs>

  <!-- Background with gradient -->
  <rect width="${size}" height="${size}" rx="${r}" fill="url(#bg)"/>

  <!-- Main chat bubble -->
  <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="${br}" fill="url(#bubble1)"/>
  <polygon points="${tx1},${ty1} ${tx2},${ty2} ${tx3},${ty3}" fill="url(#bubble1)"/>

  <!-- Dots in main bubble -->
  <circle cx="${dot1X}" cy="${dotY}" r="${dotR}" fill="#f43f5e" opacity="0.7"/>
  <circle cx="${dot2X}" cy="${dotY}" r="${dotR}" fill="#a855f7" opacity="0.7"/>
  <circle cx="${dot3X}" cy="${dotY}" r="${dotR}" fill="#4f46e5" opacity="0.7"/>

  <!-- Reply bubble (translucent) -->
  <rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="${sr}" fill="url(#bubble2)"/>
  <polygon points="${stx1},${sty1} ${stx2},${sty2} ${stx3},${sty3}" fill="url(#bubble2)"/>

  <!-- Lines in reply bubble -->
  <line x1="${lineX1}" y1="${lineY1}" x2="${lineX2a}" y2="${lineY1}" stroke="rgba(255,255,255,0.7)" stroke-width="${size * 0.015}" stroke-linecap="round"/>
  <line x1="${lineX1}" y1="${lineY2}" x2="${lineX2b}" y2="${lineY2}" stroke="rgba(255,255,255,0.5)" stroke-width="${size * 0.015}" stroke-linecap="round"/>

  <!-- Online status dot -->
  <circle cx="${size * 0.82}" cy="${size * 0.18}" r="${size * 0.045}" fill="#22c55e" stroke="url(#bg)" stroke-width="${size * 0.015}"/>
</svg>`;
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

sizes.forEach(size => {
  const svg = generateSVGIcon(size);
  const filePath = path.join(iconsDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(filePath, svg);
  console.log(`Generated: icon-${size}x${size}.svg`);
});

console.log('\nAll icons generated with ChatWave branding!');
