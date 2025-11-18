import { useState, useRef, useEffect } from 'react';
import { chatService } from '../../services/chatService';
import { Send, Loader, Bot, User, Sparkles } from 'lucide-react';
import './ChatInterface.css';

export default function ChatInterface({ document }) {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Function to parse markdown-style text into React elements
  const parseMarkdown = (text) => {
    if (!text) return null;

    // Split by lines
    const lines = text.split('\n');
    const elements = [];
    let listItems = [];
    let inList = false;

    lines.forEach((line, index) => {
      // Check for list items (bullets starting with - or * or numbered)
      const bulletMatch = line.match(/^[\s]*[-*•]\s+(.+)$/);
      const numberedMatch = line.match(/^[\s]*\d+\.\s+(.+)$/);
      
      if (bulletMatch || numberedMatch) {
        const content = bulletMatch ? bulletMatch[1] : numberedMatch[1];
        listItems.push(
          <li key={`li-${index}`} dangerouslySetInnerHTML={{ __html: parseInlineFormatting(content) }} />
        );
        inList = true;
      } else {
        // If we were in a list and now we're not, close the list
        if (inList && listItems.length > 0) {
          elements.push(<ul key={`ul-${index}`}>{listItems}</ul>);
          listItems = [];
          inList = false;
        }

        // Skip empty lines
        if (line.trim() === '') {
          return;
        }

        // Regular paragraph
        elements.push(
          <p key={`p-${index}`} dangerouslySetInnerHTML={{ __html: parseInlineFormatting(line) }} />
        );
      }
    });

    // Close any remaining list
    if (inList && listItems.length > 0) {
      elements.push(<ul key="ul-final">{listItems}</ul>);
    }

    return elements;
  };

  // Parse inline formatting (bold, code, etc.)
  const parseInlineFormatting = (text) => {
    // Bold text (**text** or __text__)
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__(.+?)__/g, '<strong>$1</strong>');
    
    // Inline code (`code`)
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    return text;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    const userMessage = { role: 'user', content: question };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);

    try {
      const response = await chatService.askQuestion(document.id, question);
      const aiMessage = {
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your question. Please try again.',
        error: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    "What is the main topic of this document?",
    "Summarize the key points",
    "What are the important dates mentioned?",
  ];

  return (
    <div className="chat-interface">
      {/* Messages Container */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-welcome">
            <div className="welcome-icon">
              <Sparkles className="h-10 w-10 text-blue-600" style={{ color: 'var(--brand-primary)' }} />
            </div>
            <h4 className="welcome-title">
              Ready to explore your document
            </h4>
            <p className="welcome-subtitle">
              Ask me anything about "{document.original_filename}". I'll help you understand the content.
            </p>
            
            {/* Suggested Questions */}
            <div className="suggested-questions">
              <p className="suggested-label">Try asking:</p>
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => setQuestion(q)}
                  className="suggested-button"
                >
                  <span>💡</span> {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="message-list">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`message-wrapper ${msg.role}`}
              >
                <div className={`message-container ${msg.role === 'user' ? 'reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`message-avatar ${msg.role} ${msg.error ? 'error' : ''}`}>
                    {msg.role === 'user' ? (
                      <User className="h-5 w-5 text-white" />
                    ) : (
                      <Bot className="h-5 w-5 text-white" style={{ color: msg.error ? 'var(--error)' : 'white' }} />
                    )}
                  </div>

                  {/* Message Content */}
                  <div className={`message-bubble ${msg.role} ${msg.error ? 'error' : ''}`}>
                    <div className="message-content">
                      {msg.role === 'user' ? (
                        // User messages remain as plain text
                        <p>{msg.content}</p>
                      ) : (
                        // Assistant messages are parsed for formatting
                        parseMarkdown(msg.content)
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div className="loading-message">
                <div className="loading-content">
                  <div className="message-avatar assistant">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div className="loading-bubble">
                    <div className="loading-indicator">
                      <Loader className="h-4 w-4 animate-spin" style={{ color: 'var(--brand-primary)' }} />
                      <span className="loading-text">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="chat-input-container">
        <form onSubmit={handleSubmit} className="chat-form">
          <div className="input-wrapper">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about this document..."
              className="chat-input"
              disabled={loading}
            />
            <div className="input-hint">
              <kbd className="kbd">Enter</kbd>
            </div>
          </div>
          <button
            type="submit"
            disabled={!question.trim() || loading}
            className="send-button"
          >
            <Send className="h-5 w-5" />
            <span>Send</span>
          </button>
        </form>
        
        <p className="chat-footer-hint">
          Press <kbd className="kbd">Enter</kbd> to send your question
        </p>
      </div>
    </div>
  );
}