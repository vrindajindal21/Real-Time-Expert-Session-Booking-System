import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { User, Send, CheckCheck } from 'lucide-react';
import { buildUrl, API_CONFIG, API_ENDPOINTS, REQUEST_CONFIG, WS_CONFIG } from '../config/api';

const MessagesPage = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchConversations();
    const newSocket = io(WS_CONFIG.url, WS_CONFIG.options);
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    socket.on('new-message', (message) => {
      // If the message belongs to the currently active conversation, append it
      if (message.conversationId === activeConvId) {
        setMessages((prev) => [...prev, message]);
      }
      
      // Update the conversations list on the left with the latest message snippet
      setConversations(prevConvs => {
        let updated = false;
        let newList = prevConvs.map(c => {
          if (c.conversationId === message.conversationId) {
            updated = true;
            return {
              ...c,
              lastMessage: {
                text: message.text,
                createdAt: message.createdAt || message.timestamp,
                isRead: false,
                senderId: message.senderId._id || message.senderId
              },
              unreadCount: message.conversationId === activeConvId ? 0 : (c.unreadCount || 0) + 1
            };
          }
          return c;
        });

        // If it's a completely new conversation, we'd need to re-fetch the list
        // For simplicity, we just trigger a refetch if updated is false
        if (!updated) {
          fetchConversations();
        }

        return newList.sort((a, b) => new Date(b.lastMessage?.createdAt) - new Date(a.lastMessage?.createdAt));
      });
    });

    return () => {
      socket.off('new-message');
    };
  }, [socket, activeConvId]);

  useEffect(() => {
    if (activeConvId && socket) {
      socket.emit('join-chat', activeConvId);
      fetchHistory(activeConvId);
      markAsRead(activeConvId);
    }
  }, [activeConvId, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_CONFIG.baseUrl}/messages/conversations`, {
        headers: REQUEST_CONFIG.addAuthHeader(token)
      });
      setConversations(data);
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (convId) => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(buildUrl(API_ENDPOINTS.CHAT.MESSAGES, { bookingId: convId }), {
        headers: REQUEST_CONFIG.addAuthHeader(token)
      });
      setMessages(data);
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  };

  const markAsRead = async (convId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_CONFIG.baseUrl}/messages/${convId}/read`, {}, {
        headers: REQUEST_CONFIG.addAuthHeader(token)
      });
      
      setConversations(prev => prev.map(c => 
        c.conversationId === convId ? { ...c, unreadCount: 0 } : c
      ));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !activeConvId) return;

    const activeConv = conversations.find(c => c.conversationId === activeConvId);
    if (!activeConv) return;

    const messageData = {
      conversationId: activeConvId,
      senderId: currentUser._id,
      recipientId: activeConv.otherUser._id,
      text: newMessage
    };

    socket.emit('send-message', messageData);
    setNewMessage('');
  };

  const activeConversation = conversations.find(c => c.conversationId === activeConvId);

  return (
    <div className="container mx-auto p-4 md:p-8" style={{ height: 'calc(100vh - 80px)' }}>
      <div className="glass rounded-2xl overflow-hidden shadow-2xl flex h-full border border-gray-100">
        
        {/* Left Sidebar */}
        <div className="w-full md:w-1/3 bg-white border-r border-gray-100 flex flex-col h-full">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-xl font-bold text-gray-800">Messages</h2>
          </div>
          
          <div className="overflow-y-auto flex-1 p-2">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No active conversations.</div>
            ) : (
              conversations.map((conv) => (
                <div 
                  key={conv.conversationId}
                  onClick={() => setActiveConvId(conv.conversationId)}
                  className={`p-4 rounded-xl cursor-pointer transition-all duration-200 flex gap-4 items-center mb-1
                    ${activeConvId === conv.conversationId ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-gray-50 border border-transparent'}`}
                >
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                    {conv.otherUser?.avatar ? (
                      <img src={conv.otherUser.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <User size={20} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-semibold text-gray-800 truncate">{conv.otherUser?.name || 'User'}</h3>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {new Date(conv.lastMessage?.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
                        {conv.lastMessage?.senderId === currentUser._id && <CheckCheck size={14} className="inline mr-1 text-gray-400" />}
                        {conv.lastMessage?.text}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className={`flex-1 flex-col bg-gray-50 h-full relative ${activeConvId ? 'flex' : 'hidden md:flex'}`}>
          {activeConvId ? (
            <>
              {/* Chat Header */}
              <div className="h-16 bg-white border-b border-gray-100 flex items-center px-6 shadow-sm z-10">
                <button className="md:hidden mr-4" onClick={() => setActiveConvId(null)}>
                  ← Back
                </button>
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-4">
                  {activeConversation?.otherUser?.avatar ? (
                    <img src={activeConversation.otherUser.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User size={18} />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{activeConversation?.otherUser?.name || 'User'}</h3>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg, i) => {
                  const isSent = msg.senderId?._id === currentUser._id || msg.senderId === currentUser._id;
                  return (
                    <div key={i} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] p-4 rounded-2xl ${
                        isSent 
                          ? 'bg-indigo-600 text-white rounded-br-sm shadow-md' 
                          : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100'
                      }`}>
                        <p className="text-sm break-words">{msg.text}</p>
                        <span className={`text-[10px] mt-2 block ${isSent ? 'text-indigo-200' : 'text-gray-400'}`}>
                          {new Date(msg.createdAt || msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 bg-white border-t border-gray-100">
                <form onSubmit={sendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 bg-gray-50"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <Send size={20} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Send size={40} className="text-gray-300 ml-2" />
              </div>
              <h2 className="text-xl font-medium text-gray-600">Your Messages</h2>
              <p>Select a conversation from the sidebar to start chatting.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
