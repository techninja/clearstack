/**
 * Built-in default OG image template — used when no project template exists.
 * @module lib/og-default-template
 */

/** @param {number} w @param {number} h */
export function builtinTemplate(w, h) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
:root {
  --bg: {bg}; --surface: {surface}; --primary: {primary};
  --accent: {accent}; --text: {text}; --text-muted: {textMuted};
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  width: ${w}px; height: ${h}px;
  display: flex; align-items: center; justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: var(--bg); color: var(--text); overflow: hidden;
}
.card {
  display: flex; width: 100%; height: 100%; padding: 60px;
  flex-direction: column; justify-content: center; gap: 24px;
  background: linear-gradient(135deg, var(--bg) 0%, var(--surface) 100%);
}
.card-with-image { flex-direction: row; align-items: center; }
.content { flex: 1; display: flex; flex-direction: column; gap: 20px; }
.title { font-size: 56px; font-weight: 800; line-height: 1.1; color: var(--primary); }
.description { font-size: 26px; line-height: 1.4; color: var(--text-muted); }
.logo { position: absolute; bottom: 40px; right: 60px; opacity: 0.7; height: 40px; }
.hero { width: 360px; height: 360px; border-radius: 24px; object-fit: cover; flex-shrink: 0; }
.badge { font-size: 18px; text-transform: uppercase; letter-spacing: 2px; color: var(--accent); font-weight: 600; }
.emoji { font-size: 80px; }
</style></head>
<body>
<div class="card {cardClass}">
  <div class="content">
    {badgeHtml}
    {emojiHtml}
    <div class="title">{title}</div>
    <div class="description">{description}</div>
  </div>
  {imageHtml}
</div>
{logoHtml}
</body></html>`;
}
