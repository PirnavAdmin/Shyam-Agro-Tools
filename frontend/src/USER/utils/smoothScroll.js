const easeInOutCubic = (progress) =>
  progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

export const scrollToElementForOneSecond = (element) => {
  if (!element) return;

  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    element.scrollIntoView({ block: 'start' });
    return;
  }

  const duration = 1000;
  const startY = window.scrollY;
  const targetY = element.getBoundingClientRect().top + window.scrollY;
  const distance = targetY - startY;
  const startedAt = window.performance.now();

  const step = (timestamp) => {
    const elapsed = timestamp - startedAt;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeInOutCubic(progress);

    window.scrollTo(0, startY + distance * easedProgress);

    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };

  window.requestAnimationFrame(step);
};
