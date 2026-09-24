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

  return (
    <div className={`sales-gama-avatar ${className}`} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 120 120"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={`SALES-GAMA android avatar - ${internalState}`}
      >
        <defs>
          <style>
            {`
              .android-skin { fill: #e8eef5; stroke: #1e3a5f; stroke-width: ${strokeWidth}; }
              .android-metal { fill: #c8d4e3; stroke: #1e3a5f; stroke-width: ${strokeWidth * 0.8}; }
              .android-dark-metal { fill: #8a9bb8; stroke: #1e3a5f; stroke-width: ${strokeWidth}; }
              .android-glass { fill: rgba(30, 58, 95, 0.15); stroke: #1e3a5f; stroke-width: ${strokeWidth * 0.5}; }
              .android-accent { fill: #0055aa; }
              .android-gold { fill: #ffd700; }
              .eye-glow { fill: #00aaff; filter: drop-shadow(0 0 4px #00aaff); }
              .eye-pupil { fill: #0a1628; }
              .mouth-line { fill: none; stroke: #00aaff; stroke-width: ${strokeWidth * 1.5}; stroke-linecap: round; }
              .mouth-talk { animation: mouthTalk 0.15s ease-in-out infinite alternate; transform-origin: center 60px; transform-box: fill-box; }
              .panel-line { stroke: #00aaff; stroke-width: ${strokeWidth * 0.4}; fill: none; opacity: 0.6; }
              .panel-line-active { animation: panelPulse 1.5s ease-in-out infinite; }
              .circuit { stroke: #ffd700; stroke-width: ${strokeWidth * 0.3}; fill: none; opacity: 0.4; }
              .circuit-active { animation: circuitFlow 2s linear infinite; }
              .processing-ring { fill: none; stroke: #00aaff; stroke-width: ${strokeWidth * 0.8}; stroke-dasharray: 8 4; transform-origin: center; transform-box: fill-box; }
              .thinking .processing-ring { animation: spinRing 1s linear infinite; }
              .talking .processing-ring { animation: pulseRing 0.5s ease-in-out infinite; }

              @keyframes mouthTalk {
                0% { transform: scaleY(0.3) translateY(0); }
                100% { transform: scaleY(1) translateY(-2px); }
              }
              @keyframes panelPulse {
                0%, 100% { opacity: 0.4; stroke-width: ${strokeWidth * 0.4}; }
                50% { opacity: 1; stroke-width: ${strokeWidth * 0.8}; }
              }
              @keyframes circuitFlow {
                0% { stroke-dashoffset: 0; }
                100% { stroke-dashoffset: 20; }
              }
              @keyframes spinRing {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              @keyframes pulseRing {
                0%, 100% { stroke-width: ${strokeWidth * 0.8}; opacity: 0.6; }
                50% { stroke-width: ${strokeWidth * 1.5}; opacity: 1; }
              }
              @keyframes blink {
                0%, 45%, 55%, 100% { transform: scaleY(1); }
                50% { transform: scaleY(0.1); }
              }
              @keyframes idleFloat {
                0%, 100% { transform: translateY(0) rotate(0deg); }
                50% { transform: translateY(-3px) rotate(0.5deg); }
              }
            `}
          </style>
        </defs>

        <g className={internalState} transform="translate(60, 60)">
          {/* Outer processing ring */}
          <circle
            className="processing-ring"
            r="52"
            stroke-dasharray="12 6"
          />

          {/* Head - realistic android shape */}
          <g className="android-head">
            {/* Head silhouette */}
            <ellipse
              className="android-skin"
              cx="0" cy="-8"
              rx="38" ry="42"
            />

            {/* Forehead panel */}
            <path
              className={`panel-line ${internalState === "thinking" || internalState === "talking" ? "panel-line-active" : ""}`}
              d="M-25 -42 Q0 -48 25 -42"
            />

            {/* Top head detail */}
            <ellipse
              className="android-dark-metal"
              cx="0" cy="-42"
              rx="8" ry="3"
            />

            {/* Eyes - realistic android eyes with glow */}
            <g className="eyes">
              {/* Left eye socket */}
              <ellipse className="android-dark-metal" cx="-18" cy="-10" rx="14" ry="12" />
              <ellipse className="android-glass" cx="-18" cy="-10" rx="12" ry="10" />
              <ellipse className="eye-glow" cx="-18" cy="-10" rx="8" ry="7">
                <animate
                  attributeName="opacity"
                  values="1;0.3;1"
                  dur="4s"
                  repeatCount="indefinite"
                  begin={internalState === "idle" ? "0s" : "0s"}
                />
              </ellipse>
              <ellipse className="eye-pupil" cx="-18" cy="-10" rx="4" ry="5">
                <animateTransform
                  attributeName="transform"
                  type="scale"
                  values="1,1;1,0.1;1,1"
                  dur="4s"
                  repeatCount="indefinite"
                  begin="0s"
                />
              </ellipse>

              {/* Right eye socket */}
              <ellipse className="android-dark-metal" cx="18" cy="-10" rx="14" ry="12" />
              <ellipse className="android-glass" cx="18" cy="-10" rx="12" ry="10" />
              <ellipse className="eye-glow" cx="18" cy="-10" rx="8" ry="7">
                <animate
                  attributeName="opacity"
                  values="1;0.3;1"
                  dur="4s"
                  repeatCount="indefinite"
                  begin="0.1s"
                />
              </ellipse>
              <ellipse className="eye-pupil" cx="18" cy="-10" rx="4" ry="5">
                <animateTransform
                  attributeName="transform"
                  type="scale"
                  values="1,1;1,0.1;1,1"
                  dur="4s"
                  repeatCount="indefinite"
                  begin="0.1s"
                />
              </ellipse>
            </g>

            {/* Nose bridge / sensor array */}
            <g className="nose-sensor">
              <path className="panel-line" d="M-2 -2 L0 -8 L2 -2" />
              <circle className="android-accent" cx="0" cy="-5" r="1.5" />
            </g>

            {/* Mouth / speaker grille */}
            <g className={`mouth ${internalState === "talking" ? "mouth-talk" : ""}`}>
              <rect className="android-dark-metal" x="-20" y="22" width="40" height="8" rx="3" ry="3" />
              <g transform="translate(0, 26)">
                {Array.from({ length: 12 }).map((_, i) => (
                  <line
                    key={i}
                    className="android-accent"
                    x1={-18 + i * 3}
                    y1="0"
                    x2={-18 + i * 3}
                    y2={internalState === "talking" ? "4" : "1"}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                  >
                    {internalState === "talking" && (
                      <animate
                        attributeName="y2"
                        values="1;4;1"
                        dur="0.15s"
                        repeatCount="indefinite"
                        begin={`${i * 0.03}s`}
                      />
                    )}
                  </line>
                ))}
              </g>
            </g>

            {/* Cheek panels / audio sensors */}
            <g className="cheek-panels">
              <ellipse className="android-metal" cx="-36" cy="8" rx="6" ry="5" />
              <ellipse className="android-metal" cx="36" cy="8" rx="6" ry="5" />
              <circle className="android-accent" cx="-36" cy="8" r="2" />
              <circle className="android-accent" cx="36" cy="8" r="2" />
            </g>

            {/* Forehead circuit patterns */}
            <g className={`circuit ${internalState === "thinking" ? "circuit-active" : ""}`}>
              <path d="M-30 -35 Q-20 -40 -10 -35" strokeDasharray="4 2" />
              <path d="M10 -35 Q20 -40 30 -35" strokeDasharray="4 2" />
              <circle cx="-20" cy="-35" r="2" fill="#ffd700" />
              <circle cx="20" cy="-35" r="2" fill="#ffd700" />
            </g>
          </g>

          {/* Neck - mechanical */}
          <g className="android-neck">
            <rect className="android-dark-metal" x="-14" y="32" width="28" height="12" rx="3" ry="3" />
            <rect className="android-metal" x="-10" y="34" width="20" height="8" rx="2" ry="2" />
            {/* Neck rings */}
            <line className="panel-line" x1="-12" y1="36" x2="12" y2="36" />
            <line className="panel-line" x1="-10" y1="40" x2="10" y2="40" />
          </g>

          {/* Shoulders / upper torso */}
          <g className="android-shoulders">
            {/* Left shoulder */}
            <ellipse className="android-skin" cx="-42" cy="48" rx="22" ry="14" />
            <ellipse className="android-metal" cx="-42" cy="48" rx="18" ry="10" />
            <path className="panel-line" d="M-55 40 Q-50 45 -48 52" />
            <path className={`circuit ${internalState === "thinking" ? "circuit-active" : ""}`} d="M-58 42 L-50 50" strokeDasharray="3 2" />

            {/* Right shoulder */}
            <ellipse className="android-skin" cx="42" cy="48" rx="22" ry="14" />
            <ellipse className="android-metal" cx="42" cy="48" rx="18" ry="10" />
            <path className="panel-line" d="M55 40 Q50 45 48 52" />
            <path className={`circuit ${internalState === "thinking" ? "circuit-active" : ""}`} d="M58 42 L50 50" strokeDasharray="3 2" />

            {/* Chest plate */}
            <path
              className="android-metal"
              d="M-30 50 Q-20 45 0 45 Q20 45 30 50 L30 68 L-30 68 Z"
            />
            <path className="panel-line" d="M-20 52 Q0 48 20 52" />
            <circle className="android-gold" cx="0" cy="54" r="6" />
            <text
              x="0" y="58"
              className="android-gold"
              text-anchor="middle"
              font-family="Arial Black, sans-serif"
              font-weight="900"
              font-size="8"
              fill="#ffd700"
            >
              GAMA
            </text>
          </g>

          {/* Idle floating animation */}
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 0,-2; 0,0"
            dur="4s"
            repeatCount="indefinite"
            begin="0s"
            additive="sum"
          />
        </g>
      </svg>

      <style>{`
        .sales-gama-avatar {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(0 4px 12px rgba(0, 51, 102, 0.2));
        }
        .sales-gama-avatar:hover {
          filter: drop-shadow(0 8px 24px rgba(0, 85, 170, 0.4));
        }
        .sales-gama-avatar svg {
          transition: filter 0.3s ease;
        }
      `}</style>
    </div>
  );
}

export default SalesGamaAvatar;