import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useNavigate } from 'react-router-dom';
import './Chat.css';

function Chat() {
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [typingIndex, setTypingIndex] = useState(null);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem("access");

  // Redirect to login if no token
  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userEntry = { user: message, bot: '' };
    const newChatLog = [...chatLog, userEntry];
    setChatLog(newChatLog);
    setMessage('');
    setIsTyping(true);

    try {
      const res = await axios.post('http://localhost:8000/chat/', { message }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const fullBotText = res.data.bot_response;

      setTypingIndex(newChatLog.length - 1);
      typeBotResponse(fullBotText, newChatLog.length - 1);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        alert('Session expired or unauthorized. Please log in again.');
        localStorage.removeItem('access');
        navigate('/login');
      } else {
        alert('Failed to contact the chatbot API.');
      }
      setIsTyping(false);
    }
  };

  const typeBotResponse = (fullText, index) => {
    let i = 0;
    const totalDuration = 2500; // 2.5 seconds total
    const updateInterval = 50; // ms
    const chunkSize = Math.max(1, Math.floor(fullText.length / (totalDuration / updateInterval)));

    setDisplayedText('');
    const interval = setInterval(() => {
      i += chunkSize;
      const partial = fullText.slice(0, i);
      setDisplayedText(partial);

      if (i >= fullText.length) {
        clearInterval(interval);
        setChatLog(prev =>
          prev.map((entry, idx) => (idx === index ? { ...entry, bot: fullText } : entry))
        );
        setTypingIndex(null);
        setIsTyping(false);
      }
    }, updateInterval);
  };

  const formatMarkdown = (text) => {
    const rawHtml = marked.parse(text || '');
    const cleanHtml = DOMPurify.sanitize(rawHtml);
    return { __html: cleanHtml };
  };

  return (
    <div className="chat-container">
      <div className="chat-log">
        <div className='header-section'>
          <h1><center>AI ChatBot</center></h1>
          <h1><center><img src='/icon-chat-bot.png' alt='icon' draggable='false'></img></center></h1>
          <h3><center>Hi! I'm Tim, your chatbot. How can I assist you today?</center></h3>
        </div>
        {chatLog.map((msg, i) => (
          <div key={i} className="chat-message">
            <div className='user-message'>
              <div className='user-box'>
                <p><strong>You:</strong> {msg.user}</p>
              </div>
            </div>
            <div className='bot-message'>
              <div className='profile'>
                <img src='/icon-chat-bot.png' alt='icon' draggable='false' className='profile-icon' />
                <strong>Tim</strong>
              </div>
              <div
                dangerouslySetInnerHTML={formatMarkdown(
                  i === typingIndex ? displayedText : msg.bot
                )}
              />
            </div>

          </div>
        ))}

        {isTyping && (
          <div className="bot-message typing-indicator">
            <p><strong>Tim </strong> <span className="typing-cursor">is typing...<span className="blink">|</span></span></p>
          </div>
        )}
      </div>

      <div className='input-enter-container'>
        <input
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
        />
        <div className='send-btn'>
          <button onClick={sendMessage}>
            <img src="/send-message.png" alt="Send" className="send-icon" draggable='false' />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chat;
