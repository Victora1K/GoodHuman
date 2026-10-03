import sharp from "sharp";

/**
 * Preview images and unsigned PDFs are watermarked (PLAN §21).
 * Videos are not re-encoded; callers watermark a poster instead.
 */
export async function watermarkImage(input: Buffer): Promise<Buffer> {
  const image = sharp(input).rotate();
  const meta = await image.metadata();
  const width = meta.width ?? 1200;
  const height = meta.height ?? 800;
  const fontSize = Math.max(18, Math.round(Math.min(width, height) * 0.045));

  const svg = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .wm { fill: rgba(255,255,255,0.55); font-family: Georgia, 'Times New Roman', serif; font-size: ${fontSize}px; font-weight: 600; }
        .shadow { fill: rgba(0,0,0,0.35); font-family: Georgia, 'Times New Roman', serif; font-size: ${fontSize}px; font-weight: 600; }
      </style>
      <text x="50%" y="50%" text-anchor="middle" class="shadow" transform="rotate(-24 ${width / 2} ${height / 2})" dx="2" dy="2">GoodHuman</text>
      <text x="50%" y="50%" text-anchor="middle" class="wm" transform="rotate(-24 ${width / 2} ${height / 2})">GoodHuman</text>
    </svg>
  `);

  return image
    .resize({
      width: Math.min(width, 1600),
      height: Math.min(height, 1600),
      fit: "inside",
      withoutEnlargement: true,
    })
    .composite([{ input: svg, gravity: "center" }])
    .jpeg({ quality: 82 })
    .toBuffer();
}

export async function makeVideoPosterPlaceholder(): Promise<Buffer> {
  const width = 1280;
  const height = 720;
  const svg = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#1a1a1a"/>
      <text x="50%" y="48%" text-anchor="middle" fill="#f5f2eb" font-family="Georgia, serif" font-size="48">Video preview</text>
      <text x="50%" y="58%" text-anchor="middle" fill="rgba(245,242,235,0.7)" font-family="Georgia, serif" font-size="28">GoodHuman</text>
    </svg>
  `);
  return watermarkImage(await sharp(svg).jpeg().toBuffer());
}
