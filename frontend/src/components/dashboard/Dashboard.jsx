import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { documentService } from '../../services/documentService';
import { Upload, FileText, MessageSquare, LogOut, File, Trash2, Calendar, Database, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import UploadForm from '../upload/UploadForm';
import ChatInterface from '../chat/ChatInterface';
import './Dashboard.css';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const data = await documentService.getDocuments();
      setDocuments(data.documents);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    setShowUpload(false);
    loadDocuments();
  };

  const handleDeleteDocument = async (docId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await documentService.deleteDocument(docId);
        loadDocuments();
        if (selectedDocument?.id === docId) {
          setSelectedDocument(null);
          setShowChat(false);
        }
      } catch (error) {
        alert('Error deleting document');
      }
    }
  };

  const handleChatWithDocument = (doc) => {
    setSelectedDocument(doc);
    setShowChat(true);
  };

  return (
    <div className="dashboard-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-content">
          <div className="navbar-brand">
            <div className="navbar-icon">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="navbar-title">
                AI Document Assistant
              </span>
            </div>
          </div>
          <div className="navbar-user">
            <div className="user-info">
              <p className="user-greeting">Welcome back!</p>
              <p className="user-name">{user?.username}</p>
            </div>
            <button
              onClick={toggleTheme}
              className="theme-toggle"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={logout}
              className="logout-button"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="main-content">
        <div className="dashboard-grid">
          {/* Documents List */}
          <div>
            <div className="documents-panel">
              <div className="panel-header">
                <div className="panel-title-container">
                  <h2>My Documents</h2>
                  <p className="panel-subtitle">{documents.length} files uploaded</p>
                </div>
                <button
                  onClick={() => setShowUpload(true)}
                  className="upload-button"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload</span>
                </button>
              </div>

              {loading ? (
                <div className="loading-state">
                  <div className="spinner">
                    <svg className="animate-spin h-16 w-16 text-blue-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <p className="loading-text">Loading documents...</p>
                </div>
              ) : documents.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <Database className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="empty-title">No documents yet</p>
                  <p className="empty-subtitle">Upload your first PDF to get started!</p>
                </div>
              ) : (
                <div className="documents-list">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className={`document-card ${selectedDocument?.id === doc.id ? 'selected' : ''}`}
                      onClick={() => handleChatWithDocument(doc)}
                    >
                      <div className="document-content">
                        <div className="document-info-container">
                          <div className="document-icon">
                            <File className="h-5 w-5" style={{ color: selectedDocument?.id === doc.id ? 'var(--brand-primary)' : 'var(--text-secondary)' }} />
                          </div>
                          <div className="document-details">
                            <p className="document-name">
                              {doc.original_filename}
                            </p>
                            <div className="document-meta">
                              <span style={{ display: 'flex', alignItems: 'center' }}>
                                <FileText className="h-3 w-3" style={{ marginRight: '0.25rem' }} />
                                {doc.page_count} pages
                              </span>
                              <span>•</span>
                              <span>{doc.file_size?.toFixed(2)} MB</span>
                            </div>
                            <p className="document-date">
                              <Calendar className="h-3 w-3" style={{ marginRight: '0.25rem' }} />
                              {new Date(doc.uploaded_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDocument(doc.id);
                          }}
                          className="delete-button"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Interface */}
          <div>
            <div className="chat-panel">
              {showChat && selectedDocument ? (
                <div>
                  <div style={{ borderBottom: '1px solid var(--border-primary)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '3rem', height: '3rem', background: 'var(--brand-gradient)', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MessageSquare className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-primary)' }}>Chat with Document</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{selectedDocument.original_filename}</p>
                      </div>
                    </div>
                  </div>
                  <ChatInterface document={selectedDocument} />
                </div>
              ) : (
                <div className="chat-empty-state">
                  <div className="chat-empty-icon">
                    <MessageSquare className="h-10 w-10" style={{ color: 'var(--text-tertiary)' }} />
                  </div>
                  <p className="chat-empty-title">Select a document to start chatting</p>
                  <p className="chat-empty-subtitle">Upload a PDF and ask questions about its content!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="modal-overlay">
          <div className="modal-content">
            <UploadForm
              onSuccess={handleUploadSuccess}
              onCancel={() => setShowUpload(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}