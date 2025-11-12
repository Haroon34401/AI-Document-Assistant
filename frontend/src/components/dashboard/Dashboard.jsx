import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { documentService } from '../../services/documentService';
import { Upload, FileText, MessageSquare, LogOut } from 'lucide-react';
import UploadForm from '../upload/UploadForm';
import ChatInterface from '../chat/ChatInterface';

export default function Dashboard() {
  const { user, logout } = useAuth();
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
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">AI Document Assistant</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.username}!</span>
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Documents List */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">My Documents</h2>
              <button
                onClick={() => setShowUpload(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Upload className="h-4 w-4" />
                <span>Upload</span>
              </button>
            </div>

            {loading ? (
              <p className="text-gray-500">Loading documents...</p>
            ) : documents.length === 0 ? (
              <p className="text-gray-500">No documents yet. Upload your first PDF!</p>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={`p-4 border rounded-lg cursor-pointer transition ${
                      selectedDocument?.id === doc.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1" onClick={() => handleChatWithDocument(doc)}>
                        <p className="font-semibold text-gray-900 truncate">
                          {doc.original_filename}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {doc.page_count} pages • {doc.file_size?.toFixed(2)} MB
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(doc.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDocument(doc.id);
                        }}
                        className="text-red-600 hover:text-red-700 ml-2"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            {showChat && selectedDocument ? (
              <ChatInterface document={selectedDocument} />
            ) : (
              <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                <MessageSquare className="h-16 w-16 mb-4" />
                <p className="text-lg">Select a document to start chatting</p>
                <p className="text-sm mt-2">Upload a PDF and ask questions about it!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
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