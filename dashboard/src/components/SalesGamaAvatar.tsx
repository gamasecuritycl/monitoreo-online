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
        className={`sg-android-desk-container relative overflow-hidden rounded-xl bg-gradient-to-b from-[#091528] via-[#06101e] to-[#040b15] border border-[#1b3558] p-1.5 sm:p-2 shadow-2xl h-[115px] sm:h-[135px] w-full ${className}`}
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
              <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0a2540" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id="radarGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#002b4d" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#031122" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="poloGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#132f57" />
              <stop offset="50%" stopColor="#0b1d38" />
              <stop offset="100%" stopColor="#061224" />
            </linearGradient>
            <linearGradient id="metalChrome" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a3b8cc" />
              <stop offset="35%" stopColor="#e2ecf7" />
              <stop offset="70%" stopColor="#8ba4c4" />
              <stop offset="100%" stopColor="#486581" />
            </linearGradient>
            <linearGradient id="armArmor" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e3a5f" />
              <stop offset="50%" stopColor="#0f2648" />
              <stop offset="100%" stopColor="#061326" />
            </linearGradient>
            <linearGradient id="pistonChrome" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#829ab1" />
              <stop offset="100%" stopColor="#334e68" />
            </linearGradient>
            <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <style>
              {`
                @keyframes handTypeLeft {
                  0%, 100% { transform: translateY(0px) rotate(0deg); }
                  25% { transform: translateY(-3px) rotate(-1.5deg); }
                  50% { transform: translateY(1.5px) rotate(1deg); }
                  75% { transform: translateY(-2px) rotate(-0.5deg); }
                }
                @keyframes handTypeRight {
                  0%, 100% { transform: translateY(0px) rotate(0deg); }
                  25% { transform: translateY(1.5px) rotate(1deg); }
                  50% { transform: translateY(-3px) rotate(1.5deg); }
                  75% { transform: translateY(-1px) rotate(0deg); }
                }
                @keyframes waveLivePulse {
                  0% { stroke-dashoffset: 80; }
                  100% { stroke-dashoffset: 0; }
                }
                @keyframes radarSweep {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
                @keyframes bodyBreathing {
                  0%, 100% { transform: translateY(0); }
                  50% { transform: translateY(-1.5px); }
                }
                .android-body {
                  animation: bodyBreathing 3.5s ease-in-out infinite;
                }
                .typing-left {
                  animation: ${isTyping ? "handTypeLeft 0.16s ease-in-out infinite" : "none"};
                  transform-origin: 170px 135px;
                }
                .typing-right {
                  animation: ${isTyping ? "handTypeRight 0.16s ease-in-out infinite 0.08s" : "none"};
                  transform-origin: 230px 135px;
                }
                .radar-line {
                  animation: radarSweep 4s linear infinite;
                  transform-origin: 320px 105px;
                }
                .signal-pulse {
                  animation: waveLivePulse 2s linear infinite;
                  stroke-dasharray: 40 10;
                }
              `}
            </style>
          </defs>

          {/* ── Fondo Oficina Central de Monitoreo ── */}
          <rect x="0" y="0" width="400" height="160" fill="none" />
          <line x1="0" y1="130" x2="400" y2="130" stroke="#12253f" strokeWidth="1.5" />
          {/* Servidores de fondo */}
          <circle cx="20" cy="25" r="2" fill="#00e5ff" opacity="0.6" />
          <circle cx="28" cy="25" r="2" fill="#25d366" opacity="0.8" />
          <circle cx="380" cy="25" r="2" fill="#00e5ff" opacity="0.7" />

          {/* ── Pantalla Lateral Izquierda (Monitor SIA / CID Live Alarms) ── */}
          <g transform="translate(30, 72)">
            {/* Marco de pantalla inclinada */}
            <polygon points="5,0 95,0 90,54 0,54" fill="#071324" stroke="#1e3a5f" strokeWidth="1.2" />
            <polygon points="8,3 92,3 88,51 3,51" fill="url(#screenGlow)" stroke="#00e5ff" strokeWidth="0.8" opacity="0.9" />
            
            {/* Header del monitor */}
            <rect x="7" y="6" width="80" height="9" fill="#050e1a" opacity="0.8" rx="2" />
            <circle cx="12" cy="10.5" r="2" fill="#25d366" className="animate-pulse" />
            <text x="18" y="13.5" fill="#a0c4e8" fontSize="6.5" fontFamily="system-ui, sans-serif" fontWeight="700">
              SIA / CID 24/7
            </text>

            {/* Gráfica de ondas de alarma en vivo */}
            <path
              d="M 6 30 L 25 30 L 32 18 L 40 42 L 48 24 L 56 34 L 64 30 L 86 30"
              fill="none"
              stroke="#00e5ff"
              strokeWidth="1.3"
              strokeLinecap="round"
              className="signal-pulse"
            />
            {/* Indicador de estado */}
            <text x="8" y="47" fill="#627d98" fontSize="5.5" fontFamily="monospace">
              STATUS: MONITOREADO
            </text>
            <circle cx="78" cy="45" r="2" fill="#00e5ff" />
          </g>

          {/* ── Pantalla Lateral Derecha (Monitor CCTV Radar 4K) ── */}
          <g transform="translate(275, 72)">
            {/* Marco de pantalla inclinada */}
            <polygon points="0,0 90,0 95,54 5,54" fill="#071324" stroke="#1e3a5f" strokeWidth="1.2" />
            <polygon points="3,3 87,3 92,51 8,51" fill="url(#radarGlow)" stroke="#00e5ff" strokeWidth="0.8" opacity="0.9" />
            
            {/* Header del monitor */}
            <rect x="8" y="6" width="80" height="9" fill="#050e1a" opacity="0.8" rx="2" />
            <circle cx="14" cy="10.5" r="2" fill="#00e5ff" className="animate-pulse" />
            <text x="20" y="13.5" fill="#a0c4e8" fontSize="6.5" fontFamily="system-ui, sans-serif" fontWeight="700">
              RADAR CCTV 4K
            </text>

            {/* Radar con círculos concéntricos y barrido */}
            <circle cx="45" cy="33" r="14" fill="none" stroke="#1b3a5b" strokeWidth="0.8" />
            <circle cx="45" cy="33" r="8" fill="none" stroke="#1b3a5b" strokeWidth="0.8" />
            <line x1="45" y1="18" x2="45" y2="48" stroke="#1b3a5b" strokeWidth="0.6" />
            <line x1="30" y1="33" x2="60" y2="33" stroke="#1b3a5b" strokeWidth="0.6" />
            {/* Línea de barrido animada */}
            <line x1="45" y1="33" x2="57" y2="23" stroke="#00e5ff" strokeWidth="1.2" strokeLinecap="round" className="radar-line" />
            
            <text x="12" y="47" fill="#627d98" fontSize="5.5" fontFamily="monospace">
              ZONA SEGURA OK
            </text>
            <circle cx="78" cy="45" r="2" fill="#25d366" />
          </g>

          {/* ── Androide Operador Central (Cuerpo y Brazos Robustos) ── */}
          <g className="android-body">
            {/* Cabeza metálica 3D */}
            <g transform="translate(200, 44)">
              {/* Cuello hidráulico reforzado */}
              <rect x="-12" y="24" width="24" height="18" rx="3" fill="#486581" stroke="#102a43" strokeWidth="1.2" />
              <line x1="-10" y1="28" x2="10" y2="28" stroke="#00e5ff" strokeWidth="1.2" opacity="0.85" />
              <line x1="-10" y1="34" x2="10" y2="34" stroke="#00e5ff" strokeWidth="1.2" opacity="0.85" />

              {/* Casco / Cráneo estilo androide */}
              <path
                d="M -25 -16 C -25 -38, 25 -38, 25 -16 C 26 8, 19 26, 0 27 C -19 26, -26 8, -25 -16 Z"
                fill="url(#metalChrome)"
                stroke="#1e3a5f"
                strokeWidth="1.8"
              />
              {/* Placas laterales del cráneo */}
              <path d="M -24 -12 C -21 5, -16 18, -7 24" fill="none" stroke="#334e68" strokeWidth="1.5" />
              <path d="M 24 -12 C 21 5, 16 18, 7 24" fill="none" stroke="#334e68" strokeWidth="1.5" />

              {/* Orejas / Sensores laterales cromados */}
              <rect x="-29" y="-6" width="5" height="15" rx="2" fill="#243b53" stroke="#00e5ff" strokeWidth="1" />
              <rect x="24" y="-6" width="5" height="15" rx="2" fill="#243b53" stroke="#00e5ff" strokeWidth="1" />

              {/* Visor / Ojos cibernéticos brillantes */}
              <path
                d="M -18 -4 Q -10 -10, 0 -10 Q 10 -10, 18 -4 Q 10 3, 0 3 Q -10 3, -18 -4 Z"
                fill="#051221"
                stroke="#102a43"
                strokeWidth="1.2"
              />
              <g className={isTyping ? "animate-pulse" : ""}>
                <circle cx="-9" cy="-4" r="3.5" fill="#00e5ff" filter="url(#cyanGlow)" />
                <circle cx="-9" cy="-4" r="1.5" fill="#ffffff" />
                <circle cx="9" cy="-4" r="3.5" fill="#00e5ff" filter="url(#cyanGlow)" />
                <circle cx="9" cy="-4" r="1.5" fill="#ffffff" />
              </g>

              {/* Rejilla vocal */}
              <line x1="-7" y1="13" x2="7" y2="13" stroke="#00e5ff" strokeWidth="1.4" strokeLinecap="round" opacity="0.9" />
              <line x1="-5" y1="16" x2="5" y2="16" stroke="#00e5ff" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
            </g>

            {/* Torso con POLERA AZUL MARINO DE GAMA (TOTALMENTE VISIBLE) */}
            <path
              d="M 146 84 C 162 78, 184 76, 200 76 C 216 76, 238 78, 254 84 L 268 135 L 132 135 Z"
              fill="url(#poloGradient)"
              stroke="#07152b"
              strokeWidth="2"
            />
            {/* Cuello de la polera con botones corporativos */}
            <path
              d="M 182 78 L 200 96 L 218 78 L 209 76 L 200 85 L 191 76 Z"
              fill="#061224"
              stroke="#1b3558"
              strokeWidth="1"
            />
            <circle cx="200" cy="89" r="1" fill="#8ba4c4" />
            <circle cx="200" cy="93" r="1" fill="#8ba4c4" />

            {/* ESCUDO OFICIAL DE GAMA EN EL PECHO (DESTACADO, SIN NINGUNA PANTALLA DELANTE) */}
            <g transform="translate(183, 93)">
              {/* Placa base del escudo con bisel iluminado */}
              <rect
                x="0"
                y="0"
                width="34"
                height="32"
                rx="6"
                fill="#040e1c"
                stroke="#00e5ff"
                strokeWidth="1.2"
                filter="url(#cyanGlow)"
              />
              <rect
                x="1.5"
                y="1.5"
                width="31"
                height="29"
                rx="5"
                fill="#071a33"
                stroke="#2997ff"
                strokeWidth="0.8"
              />
              {/* Logo Oficial GAMA */}
              <image
                href="/logo-gama.png"
                x="3"
                y="3"
                width="28"
                height="26"
                preserveAspectRatio="xMidYMid meet"
              />
            </g>

            {/* ── BRAZOS ROBÓTICOS ROBUSTOS Y MUSCULARES ── */}
            {/* HOMBRO IZQUIERDO Y BÍCEPS BLINDADO */}
            <g>
              {/* Hombrera cibernética */}
              <path
                d="M 148 84 Q 132 90, 134 108 L 148 110 Z"
                fill="url(#armArmor)"
                stroke="#1e3a5f"
                strokeWidth="1.5"
              />
              {/* Placa de titanio exterior del bíceps (gruesa, 18px de ancho) */}
              <rect x="132" y="94" width="18" height="24" rx="4" fill="url(#metalChrome)" stroke="#102a43" strokeWidth="1.2" />
              {/* Servocable de datos */}
              <line x1="141" y1="94" x2="141" y2="118" stroke="#00e5ff" strokeWidth="1.5" opacity="0.8" />
              {/* Codo articulado cromado con núcleo iluminado */}
              <circle cx="140" cy="120" r="7" fill="url(#pistonChrome)" stroke="#102a43" strokeWidth="1.5" />
              <circle cx="140" cy="120" r="3" fill="#00e5ff" filter="url(#cyanGlow)" />
            </g>

            {/* HOMBRO DERECHO Y BÍCEPS BLINDADO */}
            <g>
              {/* Hombrera cibernética */}
              <path
                d="M 252 84 Q 268 90, 266 108 L 252 110 Z"
                fill="url(#armArmor)"
                stroke="#1e3a5f"
                strokeWidth="1.5"
              />
              {/* Placa de titanio exterior del bíceps (gruesa, 18px de ancho) */}
              <rect x="250" y="94" width="18" height="24" rx="4" fill="url(#metalChrome)" stroke="#102a43" strokeWidth="1.2" />
              {/* Servocable de datos */}
              <line x1="259" y1="94" x2="259" y2="118" stroke="#00e5ff" strokeWidth="1.5" opacity="0.8" />
              {/* Codo articulado cromado con núcleo iluminado */}
              <circle cx="260" cy="120" r="7" fill="url(#pistonChrome)" stroke="#102a43" strokeWidth="1.5" />
              <circle cx="260" cy="120" r="3" fill="#00e5ff" filter="url(#cyanGlow)" />
            </g>
          </g>

          {/* ── Consola de Escritorio y Teclado Central (Bajo el Pecho) ── */}
          {/* Superficie de la mesa de control */}
          <rect x="50" y="128" width="300" height="28" rx="5" fill="#0c1e38" stroke="#1e3a5f" strokeWidth="1.5" />
          <line x1="52" y1="130" x2="348" y2="130" stroke="#00e5ff" strokeWidth="1.5" opacity="0.8" />

          {/* Teclado iluminado interactivo */}
          <rect x="150" y="132" width="100" height="20" rx="3" fill="#050e1a" stroke="#00e5ff" strokeWidth="1" />
          {/* Teclas retroiluminadas */}
          <g opacity="0.85">
            <line x1="156" y1="137" x2="244" y2="137" stroke="#486581" strokeWidth="1.8" strokeDasharray="4 2" />
            <line x1="156" y1="142" x2="244" y2="142" stroke="#486581" strokeWidth="1.8" strokeDasharray="4 2" />
            <line x1="168" y1="147" x2="232" y2="147" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* ── ANTEBRAZOS Y MANOS MECÁNICAS ROBUSTAS ESCRIBIENDO EN EL TECLADO ── */}
          {/* Antebrazo izquierdo robusto (pistón hidráulico + blindaje) */}
          <g className="typing-left">
            {/* Pistón hidráulico exterior */}
            <line x1="140" y1="120" x2="168" y2="138" stroke="#102a43" strokeWidth="13" strokeLinecap="round" />
            <line x1="140" y1="120" x2="168" y2="138" stroke="url(#metalChrome)" strokeWidth="9" strokeLinecap="round" />
            <line x1="144" y1="122" x2="165" y2="136" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
            {/* Articulación de muñeca */}
            <circle cx="168" cy="138" r="4.5" fill="#334e68" stroke="#102a43" strokeWidth="1" />
            {/* Mano robótica y dedos articulados */}
            <rect x="166" y="136" width="9" height="7" rx="2" fill="url(#metalChrome)" stroke="#102a43" strokeWidth="0.8" />
            <circle cx="177" cy="140" r="1.6" fill="#00e5ff" />
            <circle cx="176" cy="144" r="1.6" fill="#00e5ff" />
          </g>

          {/* Antebrazo derecho robusto (pistón hidráulico + blindaje) */}
          <g className="typing-right">
            {/* Pistón hidráulico exterior */}
            <line x1="260" y1="120" x2="232" y2="138" stroke="#102a43" strokeWidth="13" strokeLinecap="round" />
            <line x1="260" y1="120" x2="232" y2="138" stroke="url(#metalChrome)" strokeWidth="9" strokeLinecap="round" />
            <line x1="256" y1="122" x2="235" y2="136" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
            {/* Articulación de muñeca */}
            <circle cx="232" cy="138" r="4.5" fill="#334e68" stroke="#102a43" strokeWidth="1" />
            {/* Mano robótica y dedos articulados */}
            <rect x="225" y="136" width="9" height="7" rx="2" fill="url(#metalChrome)" stroke="#102a43" strokeWidth="0.8" />
            <circle cx="223" cy="140" r="1.6" fill="#00e5ff" />
            <circle cx="224" cy="144" r="1.6" fill="#00e5ff" />
          </g>

          {/* Badge de estado en vivo superior derecho */}
          <g transform="translate(305, 14)">
            <rect x="0" y="0" width="82" height="19" rx="9.5" fill="#000000" fillOpacity="0.6" stroke="#1b3558" strokeWidth="1.2" />
            <circle cx="11" cy="9.5" r="3.8" fill={isTyping ? "#00e5ff" : "#25d366"} className={isTyping ? "animate-ping" : ""} />
            <circle cx="11" cy="9.5" r="3.2" fill={isTyping ? "#00e5ff" : "#25d366"} />
            <text x="21" y="13" fill="#e2e8f0" fontSize="8.5" fontFamily="system-ui, sans-serif" fontWeight="700">
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