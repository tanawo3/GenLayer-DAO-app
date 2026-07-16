import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

export function MagneticCursor() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  const springConfig = { damping: 25, stiffness: 400, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);
  
  const dotX = useMotionValue(-100);
  const dotY = useMotionValue(-100);
  
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX - 16);
      cursorY.set(e.clientY - 16);
      dotX.set(e.clientX - 4);
      dotY.set(e.clientY - 4);
    };
    
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName.toLowerCase() === 'button' || 
        target.tagName.toLowerCase() === 'a' ||
        target.closest('button') ||
        target.closest('a')
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 rounded-full border border-white/30 pointer-events-none z-[9999] mix-blend-difference hidden sm:block"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          scale: isHovering ? 1.5 : 1,
          backgroundColor: isHovering ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
        }}
        transition={{ scale: { type: 'spring', stiffness: 300, damping: 20 } }}
      />
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 rounded-full bg-white pointer-events-none z-[9999] mix-blend-difference hidden sm:block"
        style={{
          x: dotX,
          y: dotY,
          scale: isHovering ? 0 : 1,
        }}
        transition={{ scale: { duration: 0.2 } }}
      />
    </>
  );
}
