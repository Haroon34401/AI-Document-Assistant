import { useState } from 'react';
import { documentService } from '../../services/documentService';
import { Upload, FileText } from 'lucide-react';
import './UploadForm.css';

export default function UploadForm({ onSuccess, onCancel }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    if (selectedFile.type !== 'application/pdf') {
      setError('Please select a PDF file');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }
    setFile(selectedFile);
    setError('');
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      await documentService.uploadDocument(file);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-container">
      <div className="upload-header">
        <div className="upload-header-content">
          <h3 className="upload-title">Upload Document</h3>
          <p className="upload-subtitle">Upload a PDF file to chat with your document</p>
        </div>
        <button onClick={onCancel} className="upload-close-button">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="upload-error">
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="upload-dropzone-wrapper">
          <label 
            className="upload-dropzone-label"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className={`upload-dropzone ${dragActive ? 'drag-active' : ''} ${file ? 'file-selected' : ''}`}>
              {file ? (
                <>
                  <div className="upload-icon-wrapper filled">
                    <FileText />
                  </div>
                  <p className="upload-file-name">{file.name}</p>
                  <p className="upload-file-size">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setFile(null);
                    }}
                    className="upload-change-file-button"
                  >
                    Choose a different file
                  </button>
                </>
              ) : (
                <>
                  <div className="upload-icon-wrapper empty">
                    <Upload />
                  </div>
                  <p className="upload-prompt-text">
                    Drop your PDF here, or <span className="browse-text">browse</span>
                  </p>
                  <p className="upload-file-limit">Maximum file size: 10MB</p>
                </>
              )}
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="upload-file-input"
              />
            </div>
          </label>
        </div>

        <div className="upload-actions">
          <button
            type="submit"
            disabled={!file || uploading}
            className="upload-submit-button"
          >
            {uploading ? (
              <span className="upload-loading-spinner">
                <svg fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </span>
            ) : (
              'Upload & Process'
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="upload-cancel-button"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}