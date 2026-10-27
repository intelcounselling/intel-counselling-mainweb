// One look for every email we send, matching the website: cream and charcoal,
// serif headings, pastel panels and pill buttons.
//
// Email clients are far less capable than browsers, so everything is inline
// styles with system fonts (Georgia stands in for the site's Playfair Display).
// Callers must escapeHtml() any user-supplied value before passing it in.

const C = {
  cream: '#F7EBD3',
  card: '#FFFDF8',
  dark: '#1F1E1B',
  green: '#1C3F39',
  gold: '#C19B6C',
  goldText: '#8a6a3f',
  text: '#4a4640',
  muted: '#8a847a',
  line: '#EDE3D0',
  sage: '#DCE8DC',
  sky: '#DCE6EE',
  lavender: '#E6DEEC',
  peach: '#F6DCC8',
};

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "'Segoe UI', Helvetica, Arial, sans-serif";
const SITE = () => process.env.PUBLIC_BASE_URL || 'https://intelcounselling.com';

export const TINT = { sage: C.sage, sky: C.sky, lavender: C.lavender, peach: C.peach, cream: C.cream };

// Paragraph
export const p = (html, extra = '') =>
  `<p style="margin:0 0 16px;font-family:${SANS};font-size:16px;line-height:1.7;color:${C.text};${extra}">${html}</p>`;

// Small section heading inside the body
export const h3 = (text) =>
  `<h3 style="margin:28px 0 10px;font-family:${SERIF};font-size:18px;font-weight:normal;color:${C.dark};">${text}</h3>`;

// Soft coloured panel for the important part of the message
export const panel = (html, tint = 'sage') =>
  `<div style="background:${TINT[tint] || tint};border-radius:18px;padding:20px 22px;margin:22px 0;font-family:${SANS};font-size:15px;line-height:1.65;color:${C.dark};">${html}</div>`;

// Big one-time code
export const codeBox = (code) =>
  `<div style="background:${C.lavender};border-radius:18px;padding:22px;margin:24px 0;text-align:center;">
     <div style="font-family:${SERIF};font-size:38px;letter-spacing:10px;color:${C.dark};font-weight:bold;">${code}</div>
   </div>`;

// Pill button
export const button = (label, href, kind = 'green') => {
  const bg = kind === 'gold' ? C.gold : C.green;
  const fg = kind === 'gold' ? C.dark : '#ffffff';
  return `<p style="margin:26px 0 8px;"><a href="${href}" style="display:inline-block;background:${bg};color:${fg};font-family:${SANS};font-size:15px;font-weight:600;text-decoration:none;padding:14px 30px;border-radius:999px;">${label}</a></p>`;
};

// Label / value rows, e.g. the details of a booking or an inquiry
export const facts = (rows) => {
  const body = rows
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([label, value]) => `<tr>
        <td style="padding:11px 0;border-bottom:1px solid ${C.line};font-family:${SANS};font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:${C.muted};width:38%;vertical-align:top;">${label}</td>
        <td style="padding:11px 0;border-bottom:1px solid ${C.line};font-family:${SANS};font-size:15px;color:${C.dark};vertical-align:top;">${value}</td>
      </tr>`)
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:8px 0 18px;">${body}</table>`;
};

// Bulleted list
export const list = (items) =>
  `<ul style="margin:6px 0 18px;padding-left:20px;font-family:${SANS};font-size:15px;line-height:1.8;color:${C.text};">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;

// Quiet closing note
export const note = (html) =>
  `<p style="margin:26px 0 0;font-family:${SANS};font-size:13px;line-height:1.6;color:${C.muted};">${html}</p>`;

// The whole email.
//   title      <title> and fallback text
//   preheader  the grey preview line shown in the inbox
//   eyebrow    small gold label above the heading (optional)
//   heading    big serif heading
//   body       HTML built from the helpers above
//   audience   'client' adds the warm sign-off; 'team' is a plain internal notice
export function emailLayout({ title, preheader = '', eyebrow = '', heading, body, audience = 'client' }) {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="color-scheme" content="light" />
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${C.cream};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.cream};">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream};">
  <tr><td align="center" style="padding:32px 14px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;border-radius:28px;overflow:hidden;background:${C.card};box-shadow:0 12px 40px rgba(31,30,27,0.12);">
      <tr><td style="background:${C.dark};padding:30px 36px 26px;text-align:left;">
        <a href="${SITE()}" style="text-decoration:none;">
          <span style="font-family:${SERIF};font-size:26px;font-style:italic;color:#F4EFE6;">Intel</span>
          <span style="font-family:${SANS};font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:${C.gold};padding-left:6px;">Counselling</span>
        </a>
      </td></tr>
      <tr><td style="padding:0;line-height:0;font-size:0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td height="6" style="background:${C.sage};font-size:0;line-height:0;">&nbsp;</td>
          <td height="6" style="background:${C.sky};font-size:0;line-height:0;">&nbsp;</td>
          <td height="6" style="background:${C.lavender};font-size:0;line-height:0;">&nbsp;</td>
          <td height="6" style="background:${C.peach};font-size:0;line-height:0;">&nbsp;</td>
          <td height="6" style="background:${C.gold};font-size:0;line-height:0;">&nbsp;</td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:38px 36px 34px;">
        ${eyebrow ? `<div style="font-family:${SANS};font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:${C.goldText};margin-bottom:10px;">${eyebrow}</div>` : ''}
        <h1 style="margin:0 0 20px;font-family:${SERIF};font-size:30px;line-height:1.25;font-weight:normal;color:${C.dark};">${heading}</h1>
        ${body}
        ${audience === 'client' ? `<p style="margin:30px 0 0;font-family:${SERIF};font-size:16px;font-style:italic;color:${C.green};">Warmly,<br/>The Intel Counselling team</p>` : ''}
      </td></tr>
      <tr><td style="background:${C.dark};padding:26px 36px;text-align:center;">
        <div style="font-family:${SERIF};font-size:15px;font-style:italic;color:#E9DCC3;">Healing begins with understanding.</div>
        <div style="margin-top:10px;font-family:${SANS};font-size:12px;line-height:1.7;color:rgba(255,255,255,0.55);">
          <a href="mailto:intelcounselling@gmail.com" style="color:rgba(255,255,255,0.7);text-decoration:none;">intelcounselling@gmail.com</a>
          &nbsp;&bull;&nbsp; +91 9363524174<br/>
          What you share with us stays confidential. &copy; ${year} Intel Counselling
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}
