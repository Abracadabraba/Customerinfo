import React, { useState } from 'react';
import { captureAndScanBusinessCard } from '../utils/businessCard';

export default function BusinessCardCapture({ cardImage, onImageCaptured, onApplyField }) {
  const [scanning, setScanning] = useState(false);
  const [lines, setLines] = useState([]);
  const [error, setError] = useState('');

  async function handleScan() {
    setError('');
    setScanning(true);
    try {
      const { imageDataUrl, lines, guesses } = await captureAndScanBusinessCard();
      onImageCaptured(imageDataUrl);
      setLines(lines);
      if (guesses.email) onApplyField('email', guesses.email);
      if (guesses.website) onApplyField('website', guesses.website);
      if (guesses.phone) onApplyField('telWhatsapp', guesses.phone);
    } catch (e) {
      console.error(e);
      setError('拍照或识别失败，请重试 / Scan failed, please try again');
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="field business-card-box">
      <label>名片 / Business Card</label>
      {cardImage && <img src={cardImage} alt="business card" className="card-preview" />}
      <button className="btn" onClick={handleScan} disabled={scanning}>
        {scanning ? '识别中… / Scanning...' : cardImage ? '重新扫描 / Re-scan' : '拍摄名片自动识别 / Scan Business Card'}
      </button>
      {error && <p className="error-text">{error}</p>}
      <p className="hint-text">
        电话/邮箱/网址会自动尝试填入对应字段；姓名、公司识别准确度有限，可点击下方识别出的文字快速填入。
      </p>
      {lines.length > 0 && (
        <div className="ocr-lines">
          {lines.map((line, idx) => (
            <div key={idx} className="ocr-line">
              <span className="ocr-line-text">{line}</span>
              <span className="ocr-line-actions">
                <button className="btn small" onClick={() => onApplyField('name', line)}>
                  填姓名
                </button>
                <button className="btn small" onClick={() => onApplyField('company', line)}>
                  填公司
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
