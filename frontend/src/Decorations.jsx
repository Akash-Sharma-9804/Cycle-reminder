import React from "react";
import { motion } from "framer-motion";

// -----------------------------------------------------------------------
// Purely decorative, purely CSS/SVG + framer-motion - no images, no extra
// libraries. Sits fixed behind all content (pointer-events: none so it
// never blocks clicks), and is scaled down / thinned out on small screens
// via Tailwind's responsive classes so it doesn't clutter a phone screen.
// -----------------------------------------------------------------------

function Butterfly({ className = "", size = 44, hue = "#B85C7D", delay = 0, duration = 7 }) {
  return (
    <motion.div
      className={`absolute pointer-events-none ${className}`}
      style={{ width: size, height: size }}
      animate={{
        x: [0, 22, -16, 8, 0],
        y: [0, -26, -8, -30, 0],
        rotate: [0, 8, -5, 4, 0],
      }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
    >
      <motion.svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        animate={{ scaleX: [1, 0.7, 1] }}
        transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <g opacity="0.85">
          <path d="M50 46 C 30 10, -5 15, 8 45 C 15 62, 35 55, 50 46 Z" fill={hue} opacity="0.9" />
          <path d="M50 46 C 70 10, 105 15, 92 45 C 85 62, 65 55, 50 46 Z" fill={hue} opacity="0.9" />
          <path d="M50 54 C 34 78, 10 78, 18 58 C 24 46, 38 50, 50 54 Z" fill={hue} opacity="0.7" />
          <path d="M50 54 C 66 78, 90 78, 82 58 C 76 46, 62 50, 50 54 Z" fill={hue} opacity="0.7" />
          <rect x="47.5" y="40" width="5" height="26" rx="2.5" fill="#3E2440" opacity="0.8" />
        </g>
      </motion.svg>
    </motion.div>
  );
}

function Flower({ className = "", size = 60, hue = "#E7A8B4", duration = 8 }) {
  return (
    <motion.svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`absolute pointer-events-none ${className}`}
      animate={{ scale: [1, 1.08, 1], rotate: [0, -5, 5, 0] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
    >
      <g opacity="0.5">
        {[0, 72, 144, 216, 288].map((deg) => (
          <ellipse key={deg} cx="50" cy="30" rx="14" ry="20" fill={hue} transform={`rotate(${deg} 50 50)`} />
        ))}
        <circle cx="50" cy="50" r="9" fill="#6B3F69" opacity="0.6" />
      </g>
    </motion.svg>
  );
}

function Petal({ left, size = 12, delay = 0, duration = 16, hue = "#E7A8B4" }) {
  return (
    <motion.div
      className="absolute pointer-events-none top-0"
      style={{ left }}
      initial={{ y: "-10vh", opacity: 0, rotate: 0 }}
      animate={{ y: "110vh", opacity: [0, 0.6, 0.6, 0], rotate: 220, x: [0, 20, -10, 15, 0] }}
      transition={{ duration, repeat: Infinity, delay, ease: "linear" }}
    >
      <svg viewBox="0 0 20 20" width={size} height={size}>
        <ellipse cx="10" cy="10" rx="6" ry="9" fill={hue} opacity="0.7" />
      </svg>
    </motion.div>
  );
}

// A tiny 4-point twinkling star/sparkle.
function Sparkle({ className = "", size = 14, delay = 0, duration = 2.4, hue = "#B85C7D" }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`absolute pointer-events-none ${className}`}
      initial={{ opacity: 0, scale: 0.4, rotate: 0 }}
      animate={{ opacity: [0, 1, 0], scale: [0.4, 1, 0.4], rotate: 60 }}
      transition={{ duration, repeat: Infinity, delay, ease: "easeInOut" }}
    >
      <path
        d="M12 0 C12 6 14 10 20 12 C14 14 12 18 12 24 C12 18 10 14 4 12 C10 10 12 6 12 0 Z"
        fill={hue}
      />
    </motion.svg>
  );
}

// A tiny drifting heart, for a little more warmth alongside the florals.
function Heart({ className = "", size = 16, delay = 0, duration = 10, hue = "#E7A8B4" }) {
  return (
    <motion.svg
      viewBox="0 0 32 29"
      width={size}
      height={size}
      className={`absolute pointer-events-none ${className}`}
      initial={{ y: 0, opacity: 0.7 }}
      animate={{ y: [-6, 6, -6], opacity: [0.5, 0.8, 0.5], rotate: [-6, 6, -6] }}
      transition={{ duration, repeat: Infinity, delay, ease: "easeInOut" }}
    >
      <path
        d="M23.6 0c-3 0-5.7 1.6-7.6 4.2C14.1 1.6 11.4 0 8.4 0 3.8 0 0 3.6 0 8.2c0 7.5 8.6 13.4 16 20.6 7.4-7.2 16-13 16-20.6C32 3.6 28.2 0 23.6 0z"
        fill={hue}
      />
    </motion.svg>
  );
}

export default function BackgroundDecor() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* corner flowers - subtle, always visible */}
      <Flower className="-top-4 -left-4 opacity-70" size={90} hue="#E7A8B4" duration={9} />
      <Flower className="-bottom-6 -right-6 opacity-60 hidden sm:block" size={120} hue="#D3A9D1" duration={11} />
      <Flower className="top-[38%] -right-8 opacity-40 hidden lg:block" size={80} hue="#B85C7D" duration={13} />

      {/* butterflies - fewer on mobile to avoid clutter */}
      <Butterfly className="top-[12%] right-[8%]" size={40} hue="#B85C7D" delay={0} duration={6.5} />
      <Butterfly className="top-[55%] left-[6%] hidden sm:block" size={34} hue="#9C5C98" delay={1.2} duration={8} />
      <Butterfly className="bottom-[16%] right-[20%] hidden md:block" size={30} hue="#E7A8B4" delay={2.4} duration={7.2} />
      <Butterfly className="top-[30%] left-[35%] hidden lg:block" size={26} hue="#D3A9D1" delay={3.6} duration={9} />

      {/* falling petals - thinned out on mobile */}
      <Petal left="10%" size={10} delay={0} duration={15} />
      <Petal left="30%" size={13} delay={4} duration={19} hue="#D3A9D1" />
      <Petal left="55%" size={9} delay={2} duration={14} />
      <Petal left="75%" size={12} delay={6} duration={17} hue="#D3A9D1" />
      <Petal left="90%" size={8} delay={8} duration={13} />
      <Petal left="20%" size={11} delay={10} duration={18} hue="#B85C7D" />
      <Petal left="65%" size={10} delay={5} duration={16} />

      {/* twinkling sparkles scattered around */}
      <Sparkle className="top-[20%] left-[20%]" size={12} delay={0} duration={2.2} />
      <Sparkle className="top-[45%] right-[30%] hidden sm:block" size={16} delay={1} duration={2.8} hue="#9C5C98" />
      <Sparkle className="bottom-[25%] left-[15%] hidden sm:block" size={10} delay={2} duration={2} />
      <Sparkle className="top-[70%] right-[10%]" size={14} delay={0.6} duration={2.6} />

      {/* soft drifting hearts */}
      <Heart className="top-[8%] left-[45%] hidden md:block" size={16} delay={0} duration={9} />
      <Heart className="bottom-[35%] right-[6%]" size={14} delay={2} duration={11} hue="#D3A9D1" />
    </div>
  );
}