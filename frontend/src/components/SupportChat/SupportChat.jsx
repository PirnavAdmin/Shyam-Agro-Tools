import React, { useEffect, useRef, useState } from 'react';
import { Bot, Headphones, MessageCircle, RotateCcw, Send, X } from 'lucide-react';
import { useLanguage } from '../../USER/context/LanguageContext';
import { getOrderById, getOrderTracking, getOrders } from '../../USER/utils/orders';
import TicketForm from './TicketForm';
import { finalOptions, findAnswer, mainOptions } from './chatKnowledgeBase';
import './SupportChat.css';

const getTime = () =>
  new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());

const createMessage = (sender, text, options = {}) => ({
  id: `${sender}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  sender,
  text,
  time: getTime(),
  ...options,
});

const getTicketId = () => {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const storageKey = `supportTicketSequence:${date}`;
  const sequence = Number(localStorage.getItem(storageKey) || '0') + 1;
  localStorage.setItem(storageKey, String(sequence));
  return `SAT-TKT-${date}-${String(sequence).padStart(3, '0')}`;
};

const trackingStepLabels = ['Ordered', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

const createWelcomeMessages = (welcomeText) => [
  createMessage('bot', welcomeText, {
    kind: 'welcome',
    options: mainOptions,
  }),
];

const getOptionId = (option) => option.id || `${option.action || 'question'}:${option.label}`;
const getMainOptionIds = () => new Set(mainOptions.map(getOptionId));

const normalizeStatusIndex = (status = '') => {
  const normalized = String(status).toLowerCase();
  if (normalized.includes('delivered')) return 4;
  if (normalized.includes('out for delivery')) return 3;
  if (normalized.includes('ship') || normalized.includes('transit')) return 2;
  if (normalized.includes('pack') || normalized.includes('confirm')) return 1;
  return 0;
};

const buildChatTracking = (orderId, labels) => {
  const order = getOrderById(orderId);
  const tracking = getOrderTracking(order);
  const stepLabels = labels.trackingSteps || trackingStepLabels;
  const activeIndex = order ? normalizeStatusIndex(tracking.status) : 2;
  const status = order ? tracking.status : labels.inTransit;

  return {
    orderId,
    status,
    estimatedDelivery: labels.estimatedDeliveryValue,
    paymentMethod: order?.paymentMethod || labels.notAvailable,
    currentStep: stepLabels[activeIndex],
    steps: stepLabels.map((label, index) => ({
      label,
      completed: index <= activeIndex,
      active: index === activeIndex,
    })),
    found: Boolean(order),
  };
};

const getLatestOrderId = () => getOrders()[0]?.id || '';

const SupportChat = () => {
  const { t, language } = useLanguage();
  const labels = {
    needHelp: t('supportChat.needHelp'),
    title: t('supportChat.title'),
    subtitle: t('supportChat.subtitle'),
    welcome: t('supportChat.welcome'),
    solved: t('supportChat.solved'),
    raiseTicket: t('supportChat.raiseTicket'),
    send: t('supportChat.send'),
    reset: t('supportChat.reset'),
    closeChat: t('supportChat.closeChat'),
    openChat: t('supportChat.openChat'),
    typeMessage: t('supportChat.typeMessage'),
    ticketSuccessWithId: t('supportChat.ticketSuccessWithId'),
    fallback: t('supportChat.fallback'),
    ticketIntro: t('supportChat.ticketIntro'),
    ticketFormPrompt: t('supportChat.ticketFormPrompt'),
    genericAnswer: t('supportChat.genericAnswer'),
    name: t('supportChat.name'),
    email: t('supportChat.email'),
    mobile: t('supportChat.mobile'),
    issueType: t('supportChat.issueType'),
    subject: t('supportChat.subject'),
    message: t('supportChat.message'),
    cancel: t('supportChat.cancel'),
    submitTicket: t('supportChat.submitTicket'),
    nextStep: t('supportChat.nextStep'),
    mainMenu: t('supportChat.mainMenu'),
    issueSolved: t('supportChat.issueSolved'),
    latestTracking: t('supportChat.latestTracking'),
    enterOrderIdPrompt: t('supportChat.enterOrderIdPrompt'),
    trackingFound: t('supportChat.trackingFound'),
    trackingFallback: t('supportChat.trackingFallback'),
    orderId: t('supportChat.tracking.orderId'),
    orderStatus: t('supportChat.tracking.orderStatus'),
    estimatedDelivery: t('supportChat.tracking.estimatedDelivery'),
    paymentMethod: t('supportChat.tracking.paymentMethod'),
    currentStep: t('supportChat.tracking.currentStep'),
    trackingTimeline: t('supportChat.tracking.timeline'),
    estimatedDeliveryValue: t('supportChat.tracking.estimatedDeliveryValue'),
    inTransit: t('supportChat.tracking.inTransit'),
    notAvailable: t('supportChat.tracking.notAvailable'),
    trackingSteps: [
      t('supportChat.tracking.steps.ordered'),
      t('supportChat.tracking.steps.packed'),
      t('supportChat.tracking.steps.shipped'),
      t('supportChat.tracking.steps.outForDelivery'),
      t('supportChat.tracking.steps.delivered'),
    ],
    ticketErrors: {
      name: t('supportChat.validation.nameRequired'),
      email: t('supportChat.validation.emailInvalid'),
      mobile: t('supportChat.validation.mobileInvalid'),
      subject: t('supportChat.validation.subjectRequired'),
      message: t('supportChat.validation.messageRequired'),
    },
    issueTypeLabels: {
      'Product Issue': t('supportChat.issueTypes.product'),
      'Cart/Wishlist Issue': t('supportChat.issueTypes.cartWishlist'),
      'Payment Issue': t('supportChat.issueTypes.payment'),
      'Delivery Issue': t('supportChat.issueTypes.delivery'),
      'Return/Refund Issue': t('supportChat.issueTypes.returnRefund'),
      'Technical Issue': t('supportChat.issueTypes.technical'),
      Other: t('supportChat.issueTypes.other'),
    },
  };
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTicketFormOpen, setIsTicketFormOpen] = useState(false);
  const [ticketIssueType, setTicketIssueType] = useState('Product Issue');
  const [messages, setMessages] = useState(() => createWelcomeMessages(labels.welcome));
  const [shownOptionIds, setShownOptionIds] = useState(getMainOptionIds);
  const [awaitingOrderId, setAwaitingOrderId] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  const getLocalizedOptionLabel = (option) => {
    const idKey = `supportChat.options.${getOptionId(option)}`;
    const idTranslation = t(idKey);
    if (idTranslation && idTranslation !== idKey) return idTranslation;

    const textKey = `supportChat.optionText.${option.label}`;
    const textTranslation = t(textKey);
    if (textTranslation && textTranslation !== textKey) return textTranslation;
    return language === 'en' ? option.label : labels.nextStep;
  };

  const getLocalizedAnswer = (entry) => {
    const key = `supportChat.answers.${entry.id}`;
    const translated = t(key);
    if (translated && translated !== key) return translated;
    return language === 'en' ? entry.answer : labels.genericAnswer;
  };

  useEffect(() => {
    if (!isOpen) return;
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [isOpen, messages, isTicketFormOpen]);

  useEffect(() => {
    if (isOpen) window.setTimeout(() => inputRef.current?.focus(), 150);
  }, [isOpen]);

  useEffect(() => {
    setInputValue('');
    setTicketIssueType('Product Issue');
    setIsTicketFormOpen(false);
    setAwaitingOrderId(false);
    setShownOptionIds(getMainOptionIds());
    setMessages(createWelcomeMessages(labels.welcome));
  }, [language]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const scrollY = window.scrollY;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const previousPosition = document.body.style.position;
    const previousTop = document.body.style.top;
    const previousWidth = document.body.style.width;
    const previousOverscroll = document.documentElement.style.overscrollBehavior;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.documentElement.style.overscrollBehavior = 'none';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      document.body.style.position = previousPosition;
      document.body.style.top = previousTop;
      document.body.style.width = previousWidth;
      document.documentElement.style.overscrollBehavior = previousOverscroll;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  const resetChat = () => {
    setInputValue('');
    setTicketIssueType('Product Issue');
    setIsTicketFormOpen(false);
    setAwaitingOrderId(false);
    setShownOptionIds(getMainOptionIds());
    setMessages(createWelcomeMessages(labels.welcome));
  };

  const rememberOptions = (options) => {
    setShownOptionIds((current) => {
      const next = new Set(current);
      options.forEach((item) => next.add(getOptionId(item)));
      return next;
    });
  };

  const getFreshOptions = (options = [], { allowSeen = false, useFinalWhenEmpty = true } = {}) => {
    if (!options.length) return [];
    const freshOptions = allowSeen ? options : options.filter((item) => !shownOptionIds.has(getOptionId(item)));
    const nextOptions = freshOptions.length || !useFinalWhenEmpty ? freshOptions : finalOptions;
    rememberOptions(nextOptions);
    return nextOptions;
  };

  const pushBot = (text, options = [], config) => {
    const nextOptions = getFreshOptions(options, config);
    window.setTimeout(() => {
      setMessages((current) => [...current, createMessage('bot', text, { options: nextOptions })]);
    }, 240);
  };

  const openTicketForm = (option = {}) => {
    setTicketIssueType(option.issueType || 'Other');
    setIsTicketFormOpen(true);
    setMessages((current) => [
      ...current,
      createMessage('user', option.label ? getLocalizedOptionLabel(option) : labels.raiseTicket),
    ]);
    pushBot(labels.ticketFormPrompt);
  };

  const showMainMenu = () => {
    setIsTicketFormOpen(false);
    setAwaitingOrderId(false);
    setShownOptionIds(getMainOptionIds());
    setMessages((current) => [
      ...current,
      createMessage('user', labels.mainMenu),
      createMessage('bot', labels.welcome, { kind: 'welcome', options: mainOptions }),
    ]);
  };

  const markSolved = () => {
    setIsTicketFormOpen(false);
    setAwaitingOrderId(false);
    setMessages((current) => [
      ...current,
      createMessage('user', labels.issueSolved),
      createMessage('bot', labels.solved, {
        options: getFreshOptions([finalOptions[2]], { allowSeen: true, useFinalWhenEmpty: false }),
      }),
    ]);
  };

  const askQuestion = (question, displayText = question) => {
    setIsTicketFormOpen(false);
    setMessages((current) => [...current, createMessage('user', displayText)]);

    const entry = findAnswer(question);
    if (!entry) {
      pushBot(labels.fallback, finalOptions, { allowSeen: true });
      return;
    }

    if (entry.id === 'track-order') {
      const latestOrderId = getLatestOrderId();
      if (latestOrderId) {
        const trackingData = buildChatTracking(latestOrderId, labels);
        setAwaitingOrderId(false);
        setMessages((current) => [
          ...current,
          createMessage('bot', labels.latestTracking, {
            tracking: trackingData,
            options: getFreshOptions(finalOptions, { allowSeen: true }),
          }),
        ]);
        return;
      }

      setAwaitingOrderId(true);
      pushBot(labels.enterOrderIdPrompt, [
        { id: 'track-help-find-order', label: 'Where is my Order?', question: 'Where is my Order?' },
        { id: 'track-help-ticket', label: 'Raise delivery ticket', action: 'ticket', issueType: 'Delivery Issue' },
        finalOptions[2],
      ]);
      return;
    }

    pushBot(getLocalizedAnswer(entry), entry.options || []);
  };

  const showOrderTracking = (orderId) => {
    const trackingData = buildChatTracking(orderId, labels);
    setAwaitingOrderId(false);
    setMessages((current) => [
      ...current,
      createMessage('user', orderId),
      createMessage('bot', trackingData.found
        ? labels.trackingFound
        : labels.trackingFallback, {
        tracking: trackingData,
        options: getFreshOptions(finalOptions, { allowSeen: true }),
      }),
    ]);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const question = inputValue.trim();
    if (!question) return;
    setInputValue('');
    if (awaitingOrderId) {
      showOrderTracking(question);
      return;
    }
    askQuestion(question);
  };

  const handleOptionClick = (option) => {
    if (option.action === 'ticket') {
      setAwaitingOrderId(false);
      openTicketForm(option);
      return;
    }
    if (option.action === 'menu') {
      showMainMenu();
      return;
    }
    if (option.action === 'solved') {
      markSolved();
      return;
    }

    setAwaitingOrderId(false);
    askQuestion(option.question || option.label, getLocalizedOptionLabel(option));
  };

  const handleTicketSubmit = (form) => {
    const ticketId = getTicketId();
    setIsTicketFormOpen(false);
    setAwaitingOrderId(false);
    setMessages((current) => [
      ...current,
      createMessage('user', `${labels.raiseTicket}: ${form.subject}`),
      createMessage('bot', labels.ticketSuccessWithId.replace('{{ticketId}}', ticketId), {
        options: finalOptions,
      }),
    ]);
  };

  return (
    <aside className="support-chat-widget" aria-label={labels.title}>
      {isOpen && (
        <section className="support-chat-panel" aria-label={labels.title}>
          <header className="support-chat-z-header">
            <div className="support-chat-brand">
              <div className="support-chat-title-copy">
                <h2>{labels.title}</h2>
              </div>
            </div>
            <button type="button" className="support-chat-icon-btn" onClick={resetChat} aria-label={labels.reset} title={labels.reset}>
              <RotateCcw size={17} />
            </button>
            <button type="button" className="support-chat-icon-btn" onClick={() => setIsOpen(false)} aria-label={labels.closeChat}>
              <X size={19} />
            </button>
          </header>

          <div className="support-chat-z-body" role="log" aria-live="polite">
            {messages.map((message) => (
              <article key={message.id} className={`support-z-message support-z-message-${message.sender}`}>
                {message.sender === 'bot' && (
                  <div className="support-z-avatar" aria-hidden="true">
                    <Bot size={15} />
                  </div>
                )}
                <div className="support-z-bubble">
                  <p>{message.text}</p>
                  {message.tracking && (
                    <div className="support-tracking-card">
                      <div className="support-tracking-grid">
                        <span>{labels.orderId}</span>
                        <strong>{message.tracking.orderId}</strong>
                        <span>{labels.orderStatus}</span>
                        <strong>{message.tracking.status}</strong>
                        <span>{labels.estimatedDelivery}</span>
                        <strong>{message.tracking.estimatedDelivery}</strong>
                        <span>{labels.paymentMethod}</span>
                        <strong>{message.tracking.paymentMethod}</strong>
                        <span>{labels.currentStep}</span>
                        <strong>{message.tracking.currentStep}</strong>
                      </div>
                      <div className="support-tracking-timeline" aria-label={labels.trackingTimeline}>
                        <div className="support-tracking-route">
                          {message.tracking.steps.map((step, index) => (
                            <React.Fragment key={`route-${step.label}`}>
                              <span className={step.completed ? 'is-complete' : ''}>{step.label}</span>
                              {index < message.tracking.steps.length - 1 && <b aria-hidden="true">-&gt;</b>}
                            </React.Fragment>
                          ))}
                        </div>
                        {message.tracking.steps.map((step) => (
                          <div
                            key={step.label}
                            className={`support-tracking-step ${step.completed ? 'is-complete' : ''} ${step.active ? 'is-active' : ''}`}
                          >
                            <span></span>
                            <p>{step.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <time>{message.time}</time>
                  {message.sender === 'bot' && message.options?.length > 0 && (
                    <div className="support-option-list" aria-label="Support options">
                      {message.options.map((option) => (
                        <button key={`${message.id}-${getOptionId(option)}`} type="button" onClick={() => handleOptionClick(option)}>
                          {option.action === 'ticket' ? labels.raiseTicket : getLocalizedOptionLabel(option)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
            {isTicketFormOpen && (
              <div className="support-z-ticket-wrap">
                <TicketForm
                  labels={labels}
                  defaultIssueType={ticketIssueType}
                  onSubmit={handleTicketSubmit}
                  onCancel={() => setIsTicketFormOpen(false)}
                />
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form className="support-chat-z-input" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="support-chat-input">
              {labels.typeMessage}
            </label>
            <input
              id="support-chat-input"
              ref={inputRef}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder={labels.typeMessage}
            />
            <button type="submit" aria-label={labels.send}>
              <Send size={17} />
            </button>
          </form>
        </section>
      )}

      <div className="support-chat-launch-wrap">
        <button
          type="button"
          className="support-chat-launch"
          onClick={() => setIsOpen((open) => !open)}
          aria-label={isOpen ? labels.closeChat : labels.openChat}
          aria-expanded={isOpen}
        >
          <MessageCircle size={30} />
          <Headphones className="support-chat-headset" size={16} />
        </button>
        <span className="support-chat-tooltip">{labels.needHelp}</span>
      </div>
    </aside>
  );
};

export default SupportChat;
