"use client";

import React, { useEffect, useState } from "react";

export type AvatarState = "idle" | "thinking" | "talking";
export type AvatarVariant = "desk" | "compact" | "bubble";

interface SalesGamaAvatarProps {
  state?: AvatarState;
  variant?: AvatarVariant;
  size?: number;
  className?: string;
  onAnimationEnd?: () => void;
}

export function SalesGamaAvatar({
  state = "idle",
  variant = "compact",
  size = 120,
  className = "",
  onAnimationEnd,
}: SalesGamaAvatarProps) {
  const [internalState, setInternalState] = useState<AvatarState>(state);

  useEffect(() => {
    setInternalState(state);
  }, [state]);

  const isTyping = internalState === "thinking" || internalState === "talking";

  // Si es la vista de escritorio completa (encabezado del chat interactivo)
  if (variant === "desk") {
    return (
      <div
        className={`sg-android-desk-container relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#091528] via-[#06101e] to-[#040b15] border border-[#1b3558] p-2 shadow-2xl ${className}`}
        style={{ width: "100%", height: "140px" }}
        role="img"
        aria-label={`Androide GAMA Especialista en Ventas - ${internalState}`}
      >
        <svg
          viewBox="0 0 400 160"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="screenGlow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#0a2540" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="poloGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f2648" />
              <stop offset="50%" stopColor="#0a1d37" />
              <stop offset="100%" stopColor="#061326" />
            </linearGradient>
            <linearGradient id="metalChrome" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#b0c4de" />
              <stop offset="50%" stopColor="#e8f0fe" />
              <stop offset="100%" stopColor="#8ba4c4" />
            </linearGradient>
            <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <style>
              {`
                @keyframes handTypeLeft {
                  0%, 100% { transform: translateY(0px) rotate(0deg); }
                  25% { transform: translateY(-4px) rotate(-2deg); }
                  50% { transform: translateY(1px) rotate(1deg); }
                  75% { transform: translateY(-3px) rotate(-1deg); }
                }
                @keyframes handTypeRight {
                  0%, 100% { transform: translateY(0px) rotate(0deg); }
                  25% { transform: translateY(1px) rotate(1deg); }
                  50% { transform: translateY(-4px) rotate(2deg); }
                  75% { transform: translateY(-1px) rotate(0deg); }
                }
                @keyframes screenPulse {
                  0%, 100% { opacity: 0.85; filter: drop-shadow(0 0 6px rgba(0, 229, 255, 0.4)); }
                  50% { opacity: 1; filter: drop-shadow(0 0 14px rgba(0, 229, 255, 0.8)); }
                }
                @keyframes codeLineMove {
                  0% { stroke-dashoffset: 60; opacity: 0.4; }
                  50% { opacity: 0.9; }
                  100% { stroke-dashoffset: 0; opacity: 0.4; }
                }
                @keyframes bodyBreathing {
                  0%, 100% { transform: translateY(0); }
                  50% { transform: translateY(-2px); }
                }
                .android-body {
                  animation: bodyBreathing 3s ease-in-out infinite;
                }
                .typing-left {
                  animation: ${isTyping ? "handTypeLeft 0.18s ease-in-out infinite" : "none"};
                  transform-origin: 175px 125px;
                }
                .typing-right {
                  animation: ${isTyping ? "handTypeRight 0.18s ease-in-out infinite 0.09s" : "none"};
                  transform-origin: 225px 125px;
                }
                .screen-active {
                  animation: ${isTyping ? "screenPulse 0.8s ease-in-out infinite" : "none"};
                }
                .code-lines {
                  animation: ${isTyping ? "codeLineMove 1.2s linear infinite" : "none"};
                  stroke-dasharray: 6 3;
                }
              `}
            </style>
          </defs>

          {/* ── Fondo Oficina de Monitoreo Central ── */}
          <rect x="0" y="0" width="400" height="160" fill="none" />
          <line x1="0" y1="130" x2="400" y2="130" stroke="#12253f" strokeWidth="1.5" />
          {/* Luces sutiles de fondo (servidores) */}
          <circle cx="20" cy="30" r="2" fill="#00e5ff" opacity="0.6" />
          <circle cx="28" cy="30" r="2" fill="#25d366" opacity="0.8" />
          <circle cx="380" cy="30" r="2" fill="#00e5ff" opacity="0.7" />

          {/* ── Androide de Medio Cuerpo ── */}
          <g className="android-body">
            {/* Cabeza metálica 3D */}
            <g transform="translate(200, 48)">
              {/* Cuello hidráulico */}
              <rect x="-10" y="24" width="20" height="16" rx="3" fill="#627d98" stroke="#102a43" strokeWidth="1" />
              <line x1="-8" y1="28" x2="8" y2="28" stroke="#00e5ff" strokeWidth="1" opacity="0.8" />
              <line x1="-8" y1="34" x2="8" y2="34" stroke="#00e5ff" strokeWidth="1" opacity="0.8" />

              {/* Casco / Cráneo estilo androide */}
              <path
                d="M -24 -15 C -24 -36, 24 -36, 24 -15 C 25 8, 18 25, 0 26 C -18 25, -25 8, -24 -15 Z"
                fill="url(#metalChrome)"
                stroke="#1e3a5f"
                strokeWidth="1.5"
              />
              {/* Placas laterales del cráneo */}
              <path d="M -23 -12 C -20 5, -15 18, -6 23" fill="none" stroke="#486581" strokeWidth="1.2" />
              <path d="M 23 -12 C 20 5, 15 18, 6 23" fill="none" stroke="#486581" strokeWidth="1.2" />

              {/* Orejas / Sensores laterales */}
              <rect x="-27" y="-6" width="4" height="14" rx="2" fill="#334e68" stroke="#00e5ff" strokeWidth="0.8" />
              <rect x="23" y="-6" width="4" height="14" rx="2" fill="#334e68" stroke="#00e5ff" strokeWidth="0.8" />

              {/* Visor / Ojos cibernéticos brillantes */}
              <path
                d="M -17 -4 Q -10 -9, 0 -9 Q 10 -9, 17 -4 Q 10 2, 0 2 Q -10 2, -17 -4 Z"
                fill="#051221"
                stroke="#102a43"
                strokeWidth="1"
              />
              <g className={isTyping ? "animate-pulse" : ""}>
                <circle cx="-8" cy="-4" r="3.2" fill="#00e5ff" filter="url(#cyanGlow)" />
                <circle cx="-8" cy="-4" r="1.4" fill="#ffffff" />
                <circle cx="8" cy="-4" r="3.2" fill="#00e5ff" filter="url(#cyanGlow)" />
                <circle cx="8" cy="-4" r="1.4" fill="#ffffff" />
              </g>

              {/* Rejilla de voz / audio */}
              <line x1="-6" y1="12" x2="6" y2="12" stroke="#00e5ff" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
              <line x1="-4" y1="15" x2="4" y2="15" stroke="#00e5ff" strokeWidth="0.9" strokeLinecap="round" opacity="0.6" />
            </g>

            {/* Torso con POLERA AZUL MARINO DE GAMA */}
            <path
              d="M 152 86 C 165 80, 185 78, 200 78 C 215 78, 235 80, 248 86 L 260 135 L 140 135 Z"
              fill="url(#poloGradient)"
              stroke="#061326"
              strokeWidth="1.5"
            />
            {/* Cuello de la polera */}
            <path
              d="M 184 80 L 200 95 L 216 80 L 208 78 L 200 86 L 192 78 Z"
              fill="#061326"
              stroke="#1b3558"
              strokeWidth="0.8"
            />

            {/* ESCUDO OFICIAL DE GAMA EN EL PECHO */}
            <g transform="translate(186, 92)">
              <rect x="-1" y="-1" width="30" height="30" rx="4" fill="#0a1d37" opacity="0.3" />
              <image
                href="/logo-gama-servicios.png"
                x="0"
                y="0"
                width="28"
                height="28"
                preserveAspectRatio="xMidYMid meet"
              />
            </g>

            {/* Brazos / Hombros del androide */}
            <path d="M 152 86 Q 140 100, 150 125" fill="none" stroke="#0a1d37" strokeWidth="16" strokeLinecap="round" />
            <path d="M 248 86 Q 260 100, 250 125" fill="none" stroke="#0a1d37" strokeWidth="16" strokeLinecap="round" />
            {/* Articulaciones cromadas de los codos */}
            <circle cx="145" cy="115" r="5" fill="#8ba4c4" stroke="#102a43" strokeWidth="1" />
            <circle cx="255" cy="115" r="5" fill="#8ba4c4" stroke="#102a43" strokeWidth="1" />
          </g>

          {/* ── Estación de Trabajo: Escritorio, Computador y Manos ── */}
          {/* Superficie del escritorio con borde iluminado */}
          <rect x="70" y="128" width="260" height="28" rx="4" fill="#0c1e38" stroke="#1e3a5f" strokeWidth="1.5" />
          <line x1="72" y1="130" x2="328" y2="130" stroke="#00e5ff" strokeWidth="1.2" opacity="0.7" />

          {/* Teclado en el escritorio */}
          <rect x="155" y="133" width="90" height="18" rx="2" fill="#06101e" stroke="#1e3a5f" strokeWidth="1" />
          {/* Teclas simuladas con luces */}
          <g opacity="0.75">
            <line x1="160" y1="137" x2="240" y2="137" stroke="#486581" strokeWidth="1.5" strokeDasharray="3 2" />
            <line x1="160" y1="141" x2="240" y2="141" stroke="#486581" strokeWidth="1.5" strokeDasharray="3 2" />
            <line x1="170" y1="146" x2="230" y2="146" stroke="#00e5ff" strokeWidth="1.5" opacity="0.8" />
          </g>

          {/* Laptop / Monitor de trabajo */}
          <g transform="translate(140, 92)">
            {/* Pantalla posterior del laptop mirando al usuario */}
            <rect
              x="20"
              y="5"
              width="80"
              height="36"
              rx="3"
              fill="url(#screenGlow)"
              stroke="#00e5ff"
              strokeWidth="1.2"
              className="screen-active"
            />
            {/* Líneas de datos / código en el monitor */}
            <line x1="28" y1="15" x2="92" y2="15" stroke="#ffffff" strokeWidth="1.5" className="code-lines" />
            <line x1="28" y1="21" x2="84" y2="21" stroke="#00e5ff" strokeWidth="1.5" className="code-lines" />
            <line x1="28" y1="27" x2="90" y2="27" stroke="#00e5ff" strokeWidth="1.5" className="code-lines" />
            <line x1="28" y1="33" x2="68" y2="33" stroke="#25d366" strokeWidth="1.5" className="code-lines" />
            {/* Base del laptop */}
            <rect x="14" y="41" width="92" height="3" rx="1.5" fill="#486581" />
          </g>

          {/* Manos y dedos del androide escribiendo en el teclado */}
          <g className="typing-left">
            {/* Antebrazo izquierdo hacia teclado */}
            <line x1="150" y1="120" x2="175" y2="137" stroke="#b0c4de" strokeWidth="5" strokeLinecap="round" />
            {/* Mano y dedos metálicos */}
            <circle cx="175" cy="137" r="3.5" fill="#e8f0fe" stroke="#102a43" strokeWidth="0.8" />
            <line x1="175" y1="137" x2="181" y2="140" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="174" y1="138" x2="180" y2="143" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" />
          </g>

          <g className="typing-right">
            {/* Antebrazo derecho hacia teclado */}
            <line x1="250" y1="120" x2="225" y2="137" stroke="#b0c4de" strokeWidth="5" strokeLinecap="round" />
            {/* Mano y dedos metálicos */}
            <circle cx="225" cy="137" r="3.5" fill="#e8f0fe" stroke="#102a43" strokeWidth="0.8" />
            <line x1="225" y1="137" x2="219" y2="140" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="226" y1="138" x2="220" y2="143" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" />
          </g>

          {/* Badge de estado en vivo */}
          <g transform="translate(310, 18)">
            <rect x="0" y="0" width="75" height="18" rx="9" fill="#000000" fillOpacity="0.4" stroke="#1b3558" strokeWidth="1" />
            <circle cx="10" cy="9" r="3.5" fill={isTyping ? "#00e5ff" : "#25d366"} className={isTyping ? "animate-ping" : ""} />
            <circle cx="10" cy="9" r="3" fill={isTyping ? "#00e5ff" : "#25d366"} />
            <text x="20" y="12.5" fill="#e2e8f0" fontSize="9" fontFamily="system-ui, sans-serif" fontWeight="600">
              {isTyping ? "ESCRIBIENDO..." : "EN LÍNEA 24/7"}
            </text>
          </g>
        </svg>
      </div>
    );
  }

  // Si es la vista compacta o burbuja
  return (
    <div
      className={`sales-gama-avatar relative flex items-center justify-center rounded-full bg-gradient-to-tr from-[#0a1d37] to-[#12284b] border border-[#2997ff]/40 shadow-lg ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Androide GAMA - ${internalState}`}
    >
      <svg
        viewBox="0 0 100 100"
        width="82%"
        height="82%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="eyeGlowSmall" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Cabeza del androide */}
        <path
          d="M 22 36 C 22 12, 78 12, 78 36 C 79 60, 70 82, 50 83 C 30 82, 21 60, 22 36 Z"
          fill="#dce5f0"
          stroke="#1b3558"
          strokeWidth="2.5"
        />

        {/* Visor negro estilizado */}
        <path
          d="M 28 42 Q 50 36, 72 42 Q 50 50, 28 42 Z"
          fill="#051221"
          stroke="#102a43"
          strokeWidth="1.5"
        />

        {/* Ojos con brillo reactivo */}
        <circle cx="39" cy="43" r="4" fill="#00e5ff" filter="url(#eyeGlowSmall)" />
        <circle cx="39" cy="43" r="1.8" fill="#ffffff" />
        <circle cx="61" cy="43" r="4" fill="#00e5ff" filter="url(#eyeGlowSmall)" />
        <circle cx="61" cy="43" r="1.8" fill="#ffffff" />

        {/* Rejilla de comunicación vocal */}
        <line
          x1="42"
          y1="64"
          x2="58"
          y2="64"
          stroke="#00e5ff"
          strokeWidth="2"
          strokeLinecap="round"
          className={internalState === "talking" ? "animate-pulse" : ""}
        />
        <line x1="45" y1="69" x2="55" y2="69" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />

        {/* Pequeño logo en la barbilla/base */}
        <circle cx="50" cy="76" r="3" fill="#00e5ff" opacity="0.9" />
      </svg>

      {/* Indicador de estado */}
      <span
        className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#050d1a] ${
          isTyping ? "bg-[#00e5ff] animate-ping" : "bg-green-400"
        }`}
      />
      <span
        className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#050d1a] ${
          isTyping ? "bg-[#00e5ff]" : "bg-green-400"
        }`}
      />
    </div>
  );
}

export default SalesGamaAvatar;