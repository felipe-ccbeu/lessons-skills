'use client';

import { CSSProperties, ReactNode } from 'react';
import { motion, Variants } from 'motion/react';

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 320, damping: 30 },
  },
};

type ContainerProps = {
  children: ReactNode;
  /** Skip staggering entirely (e.g. in edit mode, where content should just appear). */
  disabled?: boolean;
};

/** Wraps a slide's content; drives a staggered reveal of its `SlideStaggerItem` children on mount. */
export function SlideStagger({ children, disabled = false }: ContainerProps) {
  if (disabled) return <>{children}</>;
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show">
      {children}
    </motion.div>
  );
}

type ItemProps = {
  children: ReactNode;
  style?: CSSProperties;
  disabled?: boolean;
};

/** One staggered element within a `SlideStagger` — pass the same absolute-position `style` you'd put on the plain wrapper. */
export function SlideStaggerItem({ children, style, disabled = false }: ItemProps) {
  if (disabled) return <div style={style}>{children}</div>;
  return (
    <motion.div variants={itemVariants} style={style}>
      {children}
    </motion.div>
  );
}
