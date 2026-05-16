import { motion, AnimatePresence } from 'framer-motion';
import type { Transition, Variants } from 'framer-motion';
import React, { ReactNode } from 'react';

export type AnimatedGroupProps = {
  children: ReactNode;
  className?: string;
  variants?: {
    container?: Variants;
    item?: Variants;
  };
  preset?:
    | 'fade'
    | 'slide'
    | 'scale'
    | 'blur'
    | 'blur-slide'
    | 'zoom-in'
    | 'zoom-out';
};

const defaultContainerVariants: Variants = {
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const defaultItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const presetVariants: Record<
  NonNullable<AnimatedGroupProps['preset']>,
  { container: Variants; item: Variants }
> = {
  fade: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    },
  },
  slide: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    },
  },
  scale: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, scale: 0.8 },
      visible: { opacity: 1, scale: 1 },
    },
  },
  blur: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, filter: 'blur(10px)' },
      visible: { opacity: 1, filter: 'blur(0px)' },
    },
  },
  'blur-slide': {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, filter: 'blur(10px)', y: 20 },
      visible: { opacity: 1, filter: 'blur(0px)', y: 0 },
    },
  },
  'zoom-in': {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, scale: 0.5 },
      visible: { opacity: 1, scale: 1 },
    },
  },
  'zoom-out': {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, scale: 1.5 },
      visible: { opacity: 1, scale: 1 },
    },
  },
};

export function AnimatedGroup({
  children,
  className,
  variants,
  preset,
}: AnimatedGroupProps) {
  const selectedVariants = preset
    ? presetVariants[preset]
    : {
        container: variants?.container || defaultContainerVariants,
        item: variants?.item || defaultItemVariants,
      };

  return (
    <motion.div
      initial='hidden'
      animate='visible'
      variants={selectedVariants.container}
      className={className}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={selectedVariants.item}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
