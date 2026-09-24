"use client";

import { useEffect, useState } from "react";

type AvatarState = "idle" | "thinking" | "talking";

interface SalesGamaAvatarProps {
  state?: AvatarState;
  size?: number;
  className?: string;
  onAnimationEnd?: () => void;
}

export function SalesGamaAvatar({
  state = "idle",
  size = 120,
  className = "",
  onAnimationEnd,
}: SalesGamaAvatarProps) {
  const [internalState, setInternalState] = useState<AvatarState>(state);

  useEffect(() => {
    setInternalState(state);
  }, [state]);

  useEffect(() => {
    if (internalState === "thinking" || internalState === "talking") {
      const timer = setTimeout(() => {
        setInternalState("idle");
        onAnimationEnd?.();
      }, internalState === "thinking" ? 3000 : 2000);
      return () => clearTimeout(timer);
    }
  }, [internalState, onAnimationEnd]);

  const strokeWidth = Math.max(1, size / 120);
  const keyframeDuration = 0.6;

  return (
    <div className={`sales-gama-avatar ${className}`} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 120 120"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={`SALES-GAMA avatar - ${internalState}`}
      >
        <defs>
          <style>
            {`
              .robot-body { fill: #e8eef5; stroke: #1e3a5f; stroke-width: ${strokeWidth}; }
              .robot-head { fill: #d0dbe8; stroke: #1e3a5f; stroke-width: ${strokeWidth}; }
              .tshirt { fill: #003366; stroke: #002244; stroke-width: ${strokeWidth}; }
              .logo-text { fill: #ffd700; font-family: 'Arial Black', sans-serif; font-weight: 900; }
              .eye { fill: #1e3a5f; }
              .eye-blink { animation: blink 4s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
              .mouth { fill: none; stroke: #1e3a5f; stroke-width: ${strokeWidth * 1.2}; stroke-linecap: round; }
              .mouth-talk { animation: talk 0.3s ease-in-out infinite alternate; transform-origin: center 60px; transform-box: fill-box; }
              .arm { fill: #d0dbe8; stroke: #1e3a5f; stroke-width: ${strokeWidth}; transform-origin: top center; transform-box: fill-box; }
              .hand { fill: #f5e6d3; stroke: #1e3a5f; stroke-width: ${strokeWidth}; transform-origin: center; transform-box: fill-box; }
              .keyboard { fill: #2a2a2a; stroke: #1a1a1a; stroke-width: ${strokeWidth}; }
              .key { fill: #3a3a3a; stroke: #4a4a4a; stroke-width: 0.5; }
              .key-press { animation: keypress 0.15s ease-out; transform-origin: center bottom; transform-box: fill-box; }
              .antenna { fill: none; stroke: #1e3a5f; stroke-width: ${strokeWidth}; stroke-linecap: round; }
              .antenna-ball { fill: #ff6b35; stroke: #cc4411; stroke-width: ${strokeWidth * 0.5}; }
              .antenna-pulse { animation: pulse 2s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
              .thinking-bubble { fill: #fff; stroke: #1e3a5f; stroke-width: ${strokeWidth}; opacity: 0; }
              .thinking-dots { fill: #1e3a5f; opacity: 0; }
              .thinking-active .thinking-bubble,
              .thinking-active .thinking-dots { opacity: 1; animation: bubbleIn 0.3s ease-out forwards; }
              .thinking-active .left-arm { animation: typeLeft ${keyframeDuration}s ease-in-out infinite alternate; }
              .thinking-active .right-arm { animation: typeRight ${keyframeDuration}s ease-in-out infinite alternate; }
              .thinking-active .left-hand { animation: handTap ${keyframeDuration}s ease-in-out infinite alternate; }
              .thinking-active .right-hand { animation: handTap ${keyframeDuration}s ease-in-out infinite alternate; }
              .thinking-active .key-row1 { animation: keyGlow1 0.3s ease-in-out infinite alternate; }
              .thinking-active .key-row2 { animation: keyGlow2 0.3s ease-in-out infinite alternate; }
              .talking-active .mouth { animation: talk 0.15s ease-in-out infinite alternate; }
              .talking-active .left-arm { animation: gestureLeft 1.2s ease-in-out infinite; }
              .talking-active .right-arm { animation: gestureRight 1.2s ease-in-out infinite; }

              @keyframes blink {
                0%, 45%, 55%, 100% { transform: scaleY(1); }
                50% { transform: scaleY(0.1); }
              }
              @keyframes talk {
                0% { transform: scaleY(0.3); }
                100% { transform: scaleY(1); }
              }
              @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.2); opacity: 0.7; }
              }
              @keyframes typeLeft {
                0% { transform: rotate(-5deg) translateY(0); }
                100% { transform: rotate(10deg) translateY(-3px); }
              }
              @keyframes typeRight {
                0% { transform: rotate(5deg) translateY(0); }
                100% { transform: rotate(-10deg) translateY(-3px); }
              }
              @keyframes handTap {
                0% { transform: translateY(0) scale(1); }
                50% { transform: translateY(-2px) scale(0.95); }
                100% { transform: translateY(0) scale(1); }
              }
              @keyframes keyGlow1 {
                0% { fill: #3a3a3a; }
                100% { fill: #4a9eff; }
              }
              @keyframes keyGlow2 {
                0% { fill: #3a3a3a; }
                100% { fill: #ffd700; }
              }
              @keyframes keypress {
                0% { transform: translateY(0); }
                50% { transform: translateY(2px); }
                100% { transform: translateY(0); }
              }
              @keyframes gestureLeft {
                0%, 100% { transform: rotate(-10deg) translateX(0); }
                50% { transform: rotate(-25deg) translateX(-5px); }
              }
              @keyframes gestureRight {
                0%, 100% { transform: rotate(10deg) translateX(0); }
                50% { transform: rotate(25deg) translateX(5px); }
              }
              @keyframes bubbleIn {
                0% { opacity: 0; transform: translateY(10px) scale(0.9); }
                100% { opacity: 1; transform: translateY(0) scale(1); }
              }
            `}
          </style>
        </defs>

        {/* Antenna */}
        <g className="antenna">
          <line x1="60" y1="15" x2="60" y2="2" stroke-width={strokeWidth * 1.2} />
          <circle className="antenna-ball antenna-pulse" cx="60" cy="2" r="5" />
        </g>

        {/* Head */}
        <g className="robot-head">
          <rect x="25" y="15" width="70" height="50" rx="15" ry="15" />
          
          {/* Eyes */}
          <g className="eyes">
            <ellipse className="eye eye-blink" cx="45" cy="38" rx="8" ry="10" />
            <ellipse className="eye eye-blink" cx="75" cy="38" rx="8" ry="10" />
            {/* Pupils */}
            <ellipse cx="45" cy="38" rx="3" ry="5" fill="#fff" opacity="0.3" />
            <ellipse cx="75" cy="38" rx="3" ry="5" fill="#fff" opacity="0.3" />
          </g>

          {/* Mouth */}
          <g className={`mouth ${internalState === "talking" ? "mouth-talk" : ""}`}>
            <path d="M45 55 Q60 62 75 55" />
          </g>
        </g>

        {/* Body / Torso with T-shirt */}
        <g className="torso">
          {/* T-shirt body */}
          <path className="tshirt" d="M20 65 L100 65 L105 105 L15 105 Z" />
          
          {/* T-shirt sleeves */}
          <path className="tshirt" d="M15 70 L10 85 L25 80 Z" />
          <path className="tshirt" d="M105 70 L110 85 L95 80 Z" />
          
          {/* GAMA SEGURIDAD Logo on shirt */}
          <g transform="translate(60, 85) scale(0.35)">
            <text className="logo-text" text-anchor="middle" x="0" y="5" font-size="24">GAMA</text>
            <text className="logo-text" text-anchor="middle" x="0" y="25" font-size="16">SEGURIDAD</text>
          </g>
          
          {/* Neck */}
          <rect x="50" y="60" width="20" height="10" fill="#d0dbe8" stroke="#1e3a5f" stroke-width={strokeWidth} />
        </g>

        {/* Arms & Hands */}
        <g className={`arms ${internalState === "thinking" ? "thinking-active" : internalState === "talking" ? "talking-active" : ""}`}>
          {/* Left arm */}
          <g className="left-arm">
            <path className="arm" d="M20 75 Q10 85 12 98" />
            <g className="left-hand" transform="translate(12, 98)">
              <ellipse className="hand" cx="0" cy="0" rx="10" ry="7" />
              <ellipse className="hand" cx="-8" cy="8" rx="3" ry="6" />
              <ellipse className="hand" cx="-3" cy="10" rx="2.5" ry="5" />
              <ellipse className="hand" cx="2" cy="10" rx="2.5" ry="5" />
              <ellipse className="hand" cx="7" cy="8" rx="3" ry="6" />
            </g>
          </g>

          {/* Right arm */}
          <g className="right-arm">
            <path className="arm" d="M100 75 Q110 85 108 98" />
            <g className="right-hand" transform="translate(108, 98)">
              <ellipse className="hand" cx="0" cy="0" rx="10" ry="7" />
              <ellipse className="hand" cx="8" cy="8" rx="3" ry="6" />
              <ellipse className="hand" cx="3" cy="10" rx="2.5" ry="5" />
              <ellipse className="hand" cx="-2" cy="10" rx="2.5" ry="5" />
              <ellipse className="hand" cx="-7" cy="8" rx="3" ry="6" />
            </g>
          </g>
        </g>

        {/* Keyboard */}
        <g className="keyboard" transform="translate(20, 105)">
          <rect className="keyboard-base" x="0" y="0" width="80" height="18" rx="3" />
          <g className="keys">
            {/* Row 1 */}
            <g className="key-row1">
              <rect className="key" x="3" y="3" width="10" height="12" rx="1" />
              <rect className="key" x="16" y="3" width="10" height="12" rx="1" />
              <rect className="key" x="29" y="3" width="10" height="12" rx="1" />
              <rect className="key" x="42" y="3" width="10" height="12" rx="1" />
              <rect className="key" x="55" y="3" width="10" height="12" rx="1" />
              <rect className="key" x="68" y="3" width="10" height="12" rx="1" />
            </g>
            {/* Space bar */}
            <rect className="key space" x="18" y="3" width="44" height="12" rx="1" fill="#4a4a4a" />
          </g>
        </g>

        {/* Thinking bubble */}
        <g className={`thinking-bubble ${internalState === "thinking" ? "thinking-active" : ""}`}>
          <path d="M110 35 Q120 30 125 25 Q130 18 125 12 Q118 8 110 12 Q105 18 110 25 Q108 32 110 35" />
          <g className="thinking-dots" transform="translate(115, 20)">
            <circle cx="0" cy="0" r="3" >
              <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" begin="0s" />
            </circle>
            <circle cx="10" cy="0" r="3" >
              <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite" begin="0.2s" />
            </circle>
            <circle cx="20" cy="0" r="3" >
              <animate attributeName="opacity" values="0.3;0.3;1" dur="1.2s" repeatCount="indefinite" begin="0.4s" />
            </circle>
          </g>
        </g>

        {/* Decorative circuit lines on body */}
        <g opacity="0.15" stroke="#ffd700" stroke-width="0.5" fill="none">
          <path d="M30 80 L45 75" />
          <path d="M90 80 L75 75" />
          <path d="M30 95 L40 90" />
          <path d="M90 95 L80 90" />
        </g>
      </svg>

      <style jsx>{`
        .sales-gama-avatar {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .sales-gama-avatar svg {
          transition: filter 0.2s ease;
        }
        .sales-gama-avatar:hover svg {
          filter: drop-shadow(0 4px 12px rgba(0, 51, 102, 0.3));
        }
      `}</style>
    </div>
  );
}

export default SalesGamaAvatar;