import React from 'react';
import { ChevronRight } from 'lucide-react';

export const faqGroups = [
  {
    title: 'Product FAQs',
    items: [
      {
        question: 'How do I choose the correct agricultural tool?',
        answer: 'Choose based on your crop, soil type, land size, power source, and the task you want to complete. Product specifications and category filters can help you narrow the choice.',
      },
      {
        question: 'Which irrigation system is best for my farm?',
        answer: 'Drip irrigation is best for water saving and row crops. Sprinklers and rain guns work well for larger open fields and wider coverage.',
      },
      {
        question: 'How do I check product specifications?',
        answer: 'Open the product details page and review the specifications, features, media gallery, stock status, and product details sections.',
      },
      {
        question: 'How do I compare products?',
        answer: 'Open products from the same category in separate tabs and compare price, rating, specifications, warranty, delivery, and use case.',
      },
    ],
  },
  {
    title: 'Order FAQs',
    items: [
      {
        question: 'How can I track my order?',
        answer: 'Use Track Order from the header or quick support action and enter your Order ID.',
      },
      {
        question: 'How long does delivery take?',
        answer: 'Most orders show an estimated delivery window on the product page and checkout page. Standard delivery usually takes 3-7 business days.',
      },
      {
        question: 'Can I cancel my order?',
        answer: 'You can request cancellation before dispatch. If the item is already shipped, raise a support ticket for assistance.',
      },
    ],
  },
  {
    title: 'Payment FAQs',
    items: [
      {
        question: 'Which payment methods are supported?',
        answer: 'Cash on Delivery, Net Banking, UPI, and card-style online payment flows are supported in the checkout experience.',
      },
      {
        question: 'Why was my payment unsuccessful?',
        answer: 'Payment can fail due to network issues, incorrect details, insufficient balance, bank decline, or expired session.',
      },
      {
        question: 'How can I get my refund?',
        answer: 'Refunds are processed after return approval or failed-payment verification. Raise a ticket with your Order ID or transaction reference.',
      },
    ],
  },
  {
    title: 'Account FAQs',
    items: [
      {
        question: 'How do I create an account?',
        answer: 'Click Sign In or My Account and continue with your account details when the login window opens.',
      },
      {
        question: 'How do I reset my password?',
        answer: 'Use the forgot password option from the login flow and follow the OTP verification steps.',
      },
      {
        question: 'How do I update my profile?',
        answer: 'Open My Account and update your account or delivery details where available.',
      },
    ],
  },
  {
    title: 'Technical FAQs',
    items: [
      {
        question: 'Why are product images not loading?',
        answer: 'Check your internet connection, refresh the page, and retry. If the issue remains, raise a technical support ticket.',
      },
      {
        question: 'Why is the language not changing?',
        answer: 'Re-select the language, refresh translations by reloading once, and clear browser cache if the old content remains.',
      },
      {
        question: 'Why is my cart not updating?',
        answer: 'Refresh the page, check stock availability, and try adding the product again. If it persists, contact support.',
      },
    ],
  },
];

const FAQSection = ({ onAsk }) => (
  <section className="support-chat-faq" aria-label="Support FAQs">
    {faqGroups.map((group) => (
      <div key={group.title} className="support-chat-faq-group">
        <h3>{group.title}</h3>
        <div className="support-chat-faq-list">
          {group.items.map((item) => (
            <button
              key={item.question}
              type="button"
              className="support-chat-faq-item"
              onClick={() => onAsk(item)}
            >
              <span>{item.question}</span>
              <ChevronRight size={15} />
            </button>
          ))}
        </div>
      </div>
    ))}
  </section>
);

export default FAQSection;
