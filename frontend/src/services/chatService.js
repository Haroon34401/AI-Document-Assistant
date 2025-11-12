import api from './api';

export const chatService = {
  // Ask question about document
  askQuestion: async (documentId, question) => {
    const response = await api.post('/api/chat/', {
      document_id: documentId,
      question: question,
    });
    return response.data;
  },

  // Get document info for chat
  getDocumentInfo: async (documentId) => {
    const response = await api.get(`/api/chat/document/${documentId}`);
    return response.data;
  },
};