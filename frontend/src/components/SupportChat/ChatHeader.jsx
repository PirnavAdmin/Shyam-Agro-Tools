import React from 'react';
import { Minus, X } from 'lucide-react';

const ChatHeader = ({ onMinimize, onClose }) => (
  <header className="support-chat-header">
    <div>
      <span className="support-chat-status">Online Support</span>
      <h2>Shyam Agro Support</h2>
      <p>How can we help you today?</p>
    </div>
    <div className="support-chat-header-actions">
      <button type="button" onClick={onMinimize} aria-label="Minimize support chat">
        <Minus size={17} />
      </button>
      <button type="button" onClick={onClose} aria-label="Close support chat">
        <X size={17} />
      </button>
    </div>
  </header>
);

export default ChatHeader;
