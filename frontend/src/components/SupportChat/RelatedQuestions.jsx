import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const RelatedQuestions = ({ title, questions = [], onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!questions.length) return null;

  return (
    <div className="support-related">
      <button
        type="button"
        className="support-related-toggle"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        <ChevronDown size={16} className={isOpen ? 'is-open' : ''} />
      </button>
      {isOpen && (
        <div className="support-related-list">
          {questions.map((question) => (
            <button key={question} type="button" onClick={() => onSelect(question)}>
              {question}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default RelatedQuestions;
