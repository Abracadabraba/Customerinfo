import { Capacitor } from '@capacitor/core';

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result); // data:mime;base64,xxxx
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Returns { imageDataUrl, rawText, guesses: { phone, email, website } }
// On web (non-native) preview, only the photo is captured; OCR requires a real device.
export async function captureAndScanBusinessCard() {
  const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');

  const photo = await Camera.getPhoto({
    quality: 85,
    resultType: Capacitor.isNativePlatform() ? CameraResultType.Uri : CameraResultType.DataUrl,
    source: CameraSource.Prompt,
    promptLabelHeader: '名片拍照 / Business Card',
    promptLabelPhoto: '从相册选择 / Choose from gallery',
    promptLabelPicture: '拍照 / Take photo',
  });

  let imageDataUrl;
  let rawText = '';

  if (Capacitor.isNativePlatform()) {
    // Fetch the captured file so we can store it as a data URL for later export.
    const resp = await fetch(photo.webPath);
    const blob = await resp.blob();
    imageDataUrl = await blobToBase64(blob);

    try {
      const { TextRecognition } = await import('@capacitor-mlkit/text-recognition');
      const result = await TextRecognition.recognize({ path: photo.path });
      rawText = (result?.text || '').trim();
    } catch (e) {
      console.warn('OCR unavailable or failed:', e);
      rawText = '';
    }
  } else {
    // Web preview fallback: no OCR, just keep the photo for preview/testing.
    imageDataUrl = photo.dataUrl;
  }

  const guesses = extractGuesses(rawText);
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  return { imageDataUrl, rawText, lines, guesses };
}

function extractGuesses(text) {
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const websiteMatch = text.match(/\b(?:https?:\/\/|www\.)[^\s]+\.[a-zA-Z]{2,}[^\s]*/i);
  // Phone: sequences of 7+ digits, possibly with +, spaces, -, ()
  const phoneMatch = text.match(/(\+?\d[\d\s\-().]{6,}\d)/);

  return {
    email: emailMatch ? emailMatch[0] : '',
    website: websiteMatch ? websiteMatch[0] : '',
    phone: phoneMatch ? phoneMatch[0].replace(/\s{2,}/g, ' ').trim() : '',
  };
}
