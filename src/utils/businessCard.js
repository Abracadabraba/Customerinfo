import { Capacitor } from '@capacitor/core';

// Returns { imageDataUrl, rawText, lines, guesses: { phone, email, website } }
// On web (non-native) preview, only the photo is captured; OCR requires a real device.
export async function captureAndScanBusinessCard() {
  const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');

  // Base64 works uniformly on web and native, and is exactly what the OCR plugin
  // accepts too (as a data URL), so we avoid any file:// / webPath path issues.
  const photo = await Camera.getPhoto({
    quality: 85,
    resultType: CameraResultType.Base64,
    source: CameraSource.Prompt,
    promptLabelHeader: '名片拍照 / Business Card',
    promptLabelPhoto: '从相册选择 / Choose from gallery',
    promptLabelPicture: '拍照 / Take photo',
  });

  const format = photo.format || 'jpeg';
  const imageDataUrl = `data:image/${format};base64,${photo.base64String}`;

  let rawText = '';

  if (Capacitor.isNativePlatform()) {
    try {
      const { Ocr } = await import('@jcesarmobile/capacitor-ocr');
      const result = await Ocr.process({ image: imageDataUrl });
      rawText = (result?.results || [])
        .map((r) => r.text)
        .filter(Boolean)
        .join('\n')
        .trim();
    } catch (e) {
      console.warn('OCR unavailable or failed:', e);
      rawText = '';
    }
  }

  const guesses = extractGuesses(rawText);
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  return { imageDataUrl, rawText, lines, guesses };
}

const COMPANY_KEYWORDS = [
  'co.', 'co,', 'ltd', 'inc', 'corp', 'corporation', 'company', 'gmbh', 'llc',
  'pte', 'group', 'industries', 'industry', 'pharma', 'pharmaceutical',
  'technology', 'technologies', 'tech', 'international', 'holdings',
  'enterprise', 'enterprises', 'plc', 'sa', 's.a.', 'srl', 'bv',
];

const POSITION_KEYWORDS = [
  'owner', 'director', 'purchasing', 'manager', 'sales', 'engineer',
  'ceo', 'cto', 'coo', 'founder', 'president', 'executive', 'officer',
  'vice', 'representative', 'supervisor', 'chief',
];

function guessCompany(lines) {
  const hit = lines.find((l) => {
    const lower = l.toLowerCase();
    return COMPANY_KEYWORDS.some((kw) => lower.includes(kw));
  });
  return hit || '';
}

function guessName(lines, companyGuess) {
  for (const line of lines) {
    if (line === companyGuess) continue;
    if (/[@\d]/.test(line)) continue; // skip lines with digits/email
    const lower = line.toLowerCase();
    if (POSITION_KEYWORDS.some((kw) => lower.includes(kw))) continue;
    if (COMPANY_KEYWORDS.some((kw) => lower.includes(kw))) continue;
    const words = line.trim().split(/\s+/);
    if (words.length >= 2 && words.length <= 4 && /^[A-Za-z\u00C0-\u024F\u4e00-\u9fa5.\-'\s]+$/.test(line)) {
      return line;
    }
  }
  return '';
}

function extractGuesses(text) {
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const websiteMatch = text.match(/\b(?:https?:\/\/|www\.)[^\s]+\.[a-zA-Z]{2,}[^\s]*/i);
  // Phone: sequences of 7+ digits, possibly with +, spaces, -, ()
  const phoneMatch = text.match(/(\+?\d[\d\s\-().]{6,}\d)/);

  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const company = guessCompany(lines);
  const name = guessName(lines, company);

  return {
    email: emailMatch ? emailMatch[0] : '',
    website: websiteMatch ? websiteMatch[0] : '',
    phone: phoneMatch ? phoneMatch[0].replace(/\s{2,}/g, ' ').trim() : '',
    company,
    name,
  };
}
