import React from 'react';
import { Bot, UserRound } from 'lucide-react';

const ChatMessages = ({ messages, endRef }) => (
  <div className="support-chat-messages" role="log" aria-live="polite" aria-label="Support chat messages">
    {messages.map((message) => (
      <article
        key={message.id}
        className={`support-chat-message support-chat-message-${message.sender}`}
      >
        <div className="support-chat-avatar" aria-hidden="true">
          {message.sender === 'bot' ? <Bot size={16} /> : <UserRound size={16} />}
        </div>
        <div className="support-chat-bubble">
          {message.title && <strong>{message.title}</strong>}
          <p>{message.text}</p>
          {Array.isArray(message.items) && message.items.length > 0 && (
            <ul>
              {message.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
          <time>{message.time}</time>
        </div>
      </article>
    ))}
    <div ref={endRef} />
  </div>
);

export default ChatMessages;
