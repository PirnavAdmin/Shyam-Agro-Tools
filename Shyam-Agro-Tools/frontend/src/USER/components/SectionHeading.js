import React from 'react';
import { motion } from 'framer-motion';

const SectionHeading = ({
  title,
  subtitle,
  align = 'center',
  className = '',
}) => {
  const isCenter = align === 'center';

  return (
    <div
      className={`mb-8 sm:mb-10 ${
        isCenter ? 'text-center' : 'text-left'
      } ${className}`}
    >
      {subtitle && (
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-2 block text-[12px] sm:text-[14px] font-extrabold uppercase tracking-[0.2em] text-[#58B82E]"
        >
          {subtitle}
        </motion.span>
      )}

      {title && (
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="text-[30px] md:text-[40px] lg:text-[48px] font-bold uppercase text-dark tracking-tight leading-tight"
        >
          {title}
        </motion.h2>
      )}

      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: 80 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.16 }}
        className={`mt-3 h-1 rounded-full bg-[#58B82E] ${
          isCenter ? 'mx-auto' : ''
        }`}
      />
    </div>
  );
};

export default SectionHeading;
