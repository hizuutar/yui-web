import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { personalityTypes, chatStorage, getPrompt } from './prompts';
import { GEMINI_API_KEY } from './config';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPersonality, setSelectedPersonality] = useState('tsundere');
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history
  useEffect(() => {
    const { messages, personality } = chatStorage.loadChat();
    setMessages(messages);
    setSelectedPersonality(personality);
  }, []);

  // Save chat history
  useEffect(() => {
    chatStorage.saveChat(messages, selectedPersonality);
  }, [messages, selectedPersonality]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      const prompt = `${getPrompt(selectedPersonality)}\n\nUser: ${inputMessage}\nAssistant:`;
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      const aiMessage = {
        id: Date.now() + 1,
        text: response,
        sender: 'ai',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Em xin lỗi anh, em đang gặp chút vấn đề ><',
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setMessages([]);
    chatStorage.clearChat();
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-4 bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg p-4 flex-grow flex flex-col">
        {/* Header */}
        <div className="flex flex-col gap-4 pb-4 border-b">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-pink-500">Chat with Your Little Sister</h1>
            <button
              onClick={clearHistory}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear Chat
            </button>
          </div>
          
          {/* Personality Selector */}
          <select 
            value={selectedPersonality}
            onChange={(e) => setSelectedPersonality(e.target.value)}
            className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            {Object.entries(personalityTypes).map(([key, value]) => (
              <option key={key} value={key}>
                {value.name} - {value.description}
              </option>
            ))}
          </select>
        </div>

        {/* Messages */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-pink-100 text-gray-800'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.text}</div>
                <div className="text-xs opacity-70 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-pink-100 text-gray-800 rounded-lg p-3">
                Em đang suy nghĩ...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t pt-4 mt-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Nói gì với em đi anh..."
              className="flex-grow p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading}
              className="bg-pink-500 text-white p-2 rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;