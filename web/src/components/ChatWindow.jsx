import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { Send, User, X } from 'lucide-react';
import axios from 'axios';
import { WS_CONFIG, buildUrl, REQUEST_CONFIG, API_ENDPOINTS } from '../config/api';

const ChatWindow = ({ receiverId, receiverName, bookingId, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const currentUserId = JSON.parse(localStorage.getItem('user'))?._id;
  const conversationId = [currentUserId, receiverId].sort().join('_');

  useEffect(() => {
    const newSocket = io(WS_CONFIG.url, WS_CONFIG.options);
    setSocket(newSocket);

    // Join room based on conversationId (unified thread)
    if (receiverId) {
      newSocket.emit('join-chat', conversationId);
      fetchHistory(conversationId);
    }

    newSocket.on('new-message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => newSocket.close();
  }, [receiverId, conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchHistory = async (id) => {
    try {
      const token = localStorage.getItem('token');
      // The API endpoint was mapped to messages/:bookingId but it's now used for conversationId
      const { data } = await axios.get(buildUrl(API_ENDPOINTS.CHAT.MESSAGES, { bookingId: id }), {
        headers: REQUEST_CONFIG.addAuthHeader(token)
      });
      setMessages(data);
    } catch (err) {
      console.error('History fetch failed', err);
      const message = REQUEST_CONFIG.handleErrorResponse(err);
      console.error('Error message:', message);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !receiverId) return;

    const messageData = {
      conversationId,
      bookingId, // Keep it if it exists (optional)
      senderId: currentUserId,
      recipientId: receiverId,
      text: newMessage
    };

    socket.emit('send-message', messageData);
    setNewMessage('');
  };

  return (
    <div className="chat-window glass">
      <div className="chat-header">
        <div className="user-info">
          <div className="avatar"><User size={16} /></div>
          <h4>{receiverName}</h4>
        </div>
        <button onClick={onClose} className="close-btn"><X size={20} /></button>
      </div>

      <div className="messages-container">
        {messages.map((msg, i) => (
          <div key={i} className={`message-bubble ${msg.senderId === currentUserId ? 'sent' : 'received'}`}>
            <p>{msg.text}</p>
            <span className="time">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="chat-input-area">
        <input 
          type="text" 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="chat-input"
        />
        <button type="submit" className="send-btn"><Send size={20} /></button>
      </form>

      <style jsx>{`
        .chat-window {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 360px;
          height: 480px;
          display: flex;
          flex-direction: column;
          z-index: 10000;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          overflow: hidden;
          border-radius: 24px;
        }
        .chat-header {
          padding: 16px 20px;
          background: var(--primary);
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .user-info { display: flex; align-items: center; gap: 12px; }
        .avatar { width: 32px; height: 32px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .close-btn { background: none; border: none; color: white; cursor: pointer; }
        
        .messages-container { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; background: rgba(255,255,255,0.5); }
        .message-bubble { max-width: 80%; padding: 10px 16px; border-radius: 16px; position: relative; }
        .sent { align-self: flex-end; background: var(--primary); color: white; border-bottom-right-radius: 4px; }
        .received { align-self: flex-start; background: white; border-bottom-left-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .time { font-size: 0.7rem; opacity: 0.7; margin-top: 4px; display: block; text-align: right; }

        .chat-input-area { padding: 16px; background: white; display: flex; gap: 12px; border-top: 1px solid var(--glass-border); }
        .chat-input { flex: 1; border: 1px solid var(--glass-border); border-radius: 100px; padding: 10px 20px; outline: none; }
        .send-btn { background: var(--primary); color: white; border: none; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }
      `}</style>
    </div>
  );
};

export default ChatWindow;
