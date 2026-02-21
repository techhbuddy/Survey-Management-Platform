import React, { useEffect, useState } from 'react';
import apiClient from '../../services/api';
import './QRCodeModal.css';
  
// Reusable QR Code Modal component
// Props: shareableLink (string), surveyId (string), surveyTitle (string), onClose()
const QRCodeModal = ({ shareableLink, surveyId, surveyTitle, onClose }) => {
  const [imgUrl, setImgUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!shareableLink && !surveyId) return;

    const fetchQr = async () => {
      try {
        setLoading(true);
        setError(null);

        // Prefer fetching by shareable link
        const endpoint = surveyId
          ? `/surveys/${surveyId}/qr`
          : `/surveys/share/${encodeURIComponent(shareableLink)}/qr`;

        const resp = await apiClient.get(endpoint, { responseType: 'blob' });
        const blob = resp.data;
        const url = URL.createObjectURL(blob);
        setImgUrl(url);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load QR code');
      } finally {
        setLoading(false);
      }
    };

    fetchQr();

    return () => {
      if (imgUrl) URL.revokeObjectURL(imgUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareableLink, surveyId]);

  const handleDownload = () => {
    if (!imgUrl) return;
    // Create a hidden link to download the image
    const a = document.createElement('a');
    a.href = imgUrl;
    const safeName = (surveyTitle || 'survey').replace(/[^a-z0-9-_.]/gi, '_');
    a.download = `survey-qr-${safeName}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="qr-modal-overlay" onClick={onClose}>
      <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="qr-modal-header">
          <h3>{surveyTitle || 'Survey QR'}</h3>
          <button className="qr-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="qr-modal-body">
          {loading && <p>Generating QR code...</p>}
          {error && <p className="qr-error">{error}</p>}
          {!loading && !error && imgUrl && (
            <img src={imgUrl} alt="Survey QR Code" className="qr-image" />
          )}
        </div>

        <div className="qr-modal-footer">
          <button className="btn btn-outline" onClick={handleDownload} disabled={!imgUrl}>
            Download QR Code
          </button>
          <button className="btn btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;

