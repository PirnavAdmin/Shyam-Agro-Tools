import React, { useEffect, useRef } from 'react';
import lottie from 'lottie-web';
import orderSuccessAnimation from '../assets/order-success-animation.json';

const OrderSuccessAnimation = ({ className = '', onComplete, speed = 1 }) => {
  const containerRef = useRef(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!containerRef.current) return undefined;

    const animation = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: false,
      autoplay: true,
      animationData: orderSuccessAnimation,
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid meet',
      },
    });

    animation.setSpeed(speed);
    animation.addEventListener('complete', () => {
      onCompleteRef.current?.();
    });

    return () => animation.destroy();
  }, [speed]);

  return (
    <div
      ref={containerRef}
      className={`order-success-lottie ${className}`.trim()}
      aria-hidden="true"
    />
  );
};

export default OrderSuccessAnimation;
