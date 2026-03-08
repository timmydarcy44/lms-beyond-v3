const sharp = require("sharp");
const fs = require("fs");

// Crée un carré rouge #C8102E avec "B" blanc en différentes tailles dans public/icons/
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// SVG source de l'icône Beyond
const svgIcon = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="80" fill="#C8102E"/>
  <text x="256" y="340" font-family="Arial Black, sans-serif" font-size="280" font-weight="900" fill="white" text-anchor="middle">B</text>
</svg>
`;

if (!fs.existsSync("public/icons")) {
  fs.mkdirSync("public/icons", { recursive: true });
}

sizes.forEach((size) => {
  sharp(Buffer.from(svgIcon))
    .resize(size, size)
    .png()
    .toFile(`public/icons/icon-${size}x${size}.png`)
    .then(() => console.log(`✓ icon-${size}x${size}.png`));
});
