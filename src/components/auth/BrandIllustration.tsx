"use client";

import React, { memo, useMemo } from "react";

interface BrandIllustrationProps {
  isDark?: boolean;
}

/**
 * Optimized Brand Illustration Component
 * 
 * Optimizations applied:
 * 1. React.memo - prevents re-renders unless isDark changes
 * 2. useMemo - caches color calculations
 * 3. CSS animations instead of SMIL - GPU accelerated, 60fps
 * 4. will-change hints - compositor optimization
 * 5. Simplified filters - reduced blur complexity
 * 6. transform/opacity only - avoids layout thrashing
 */

// Static node positions - defined outside component to avoid recreating
const NODES = [
  { x: 200, y: 200, label: "INGESTION", sublabel: "Schema & source intake" },
  { x: 400, y: 200, label: "ENRICHMENT", sublabel: "Metadata & structure" },
  { x: 120, y: 400, label: "VALIDATION", sublabel: "Integrity & compliance" },
  { x: 480, y: 400, label: "NORMALIZATION", sublabel: "Canonical formatting" },
  { x: 200, y: 600, label: "REVIEW", sublabel: "Human verification loop" },
  { x: 400, y: 600, label: "PUBLISHING", sublabel: "Marketplace availability" },
] as const;

// Connection lines from center to nodes
const CONNECTIONS = [
  { x1: 300, y1: 400, x2: 200, y2: 200 },
  { x1: 300, y1: 400, x2: 400, y2: 200 },
  { x1: 300, y1: 400, x2: 120, y2: 400 },
  { x1: 300, y1: 400, x2: 480, y2: 400 },
  { x1: 300, y1: 400, x2: 200, y2: 600 },
  { x1: 300, y1: 400, x2: 400, y2: 600 },
] as const;

// Pulse points on connection lines
const PULSE_POINTS = [
  { cx: 250, cy: 300, delay: 0 },
  { cx: 350, cy: 300, delay: 0.3 },
  { cx: 210, cy: 400, delay: 0.6 },
  { cx: 390, cy: 400, delay: 0.9 },
  { cx: 250, cy: 500, delay: 1.2 },
  { cx: 350, cy: 500, delay: 1.5 },
] as const;

function BrandIllustrationComponent({ isDark = false }: BrandIllustrationProps) {
  // Memoize all color calculations
  const colors = useMemo(() => ({
    // Orbit rings
    orbitStroke: isDark ? "rgba(255, 255, 255, 0.18)" : "rgba(26, 34, 64, 0.35)",
    orbitStrokeAlt: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(26, 34, 64, 0.30)",
    orbitStrokeLight: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(26, 34, 64, 0.25)",
    
    // Connection lines
    lineStroke: isDark ? "rgba(180, 200, 230, 0.5)" : "rgba(60, 80, 120, 0.5)",
    
    // Hub center
    hubOuter: isDark ? "rgba(160, 185, 220, 0.6)" : "rgba(60, 80, 120, 0.6)",
    hubMiddle: isDark ? "rgba(170, 195, 230, 0.7)" : "rgba(60, 80, 120, 0.7)",
    hubInner: isDark ? "rgba(120, 145, 190, 0.6)" : "rgba(78, 90, 126, 0.5)",
    hubCore: isDark ? "rgba(200, 220, 250, 0.8)" : "rgba(78, 90, 126, 0.7)",
    
    // Text
    textPrimary: isDark ? "rgba(220, 235, 255, 0.85)" : "rgba(26, 34, 64, 0.85)",
    textSecondary: isDark ? "rgba(200, 220, 240, 0.6)" : "rgba(78, 90, 126, 0.7)",
    textBrand: isDark ? "rgba(229, 231, 235, 0.65)" : "rgba(26, 34, 64, 0.7)",
    
    // Nodes
    nodeStroke: isDark ? "rgba(190, 210, 240, 0.7)" : "rgba(60, 80, 120, 0.65)",
    nodeDetail: isDark ? "rgba(200, 220, 250, 0.6)" : "rgba(78, 90, 126, 0.6)",
    nodeBg: isDark ? "rgba(200, 220, 250, 0.25)" : "rgba(78, 90, 126, 0.3)",
    
    // Pulse dots
    pulseFill: isDark ? "rgba(200, 220, 250, 0.7)" : "rgba(78, 90, 126, 0.65)",
    
    // Gradients
    gradientStart: isDark ? "rgba(140, 165, 200, 0.4)" : "rgba(90, 110, 150, 0.35)",
    gradientEnd: isDark ? "rgba(90, 110, 150, 0.3)" : "rgba(60, 80, 120, 0.25)",
  }), [isDark]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Brand statement */}
      <div className="absolute top-10 left-0 right-0 flex flex-col items-center justify-center px-8">
        <p 
          className="text-sm tracking-[0.1em] uppercase text-center font-medium transition-colors duration-500"
          style={{ 
            color: colors.textBrand,
            textShadow: isDark ? "0 2px 8px rgba(0, 0, 0, 0.4)" : "0 1px 3px rgba(0, 0, 0, 0.1)",
          }}
        >
          Powering Trusted Data Distribution
        </p>
      </div>

      {/* CSS for GPU-accelerated animations */}
      <style jsx>{`
        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes rotate-slow-reverse {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        @keyframes pulse-opacity {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        @keyframes hub-pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        @keyframes data-flow {
          0% { offset-distance: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { offset-distance: 100%; opacity: 0; }
        }
        .orbit-1 {
          transform-origin: 300px 400px;
          animation: rotate-slow 60s linear infinite;
          will-change: transform;
        }
        .orbit-2 {
          transform-origin: 300px 400px;
          animation: rotate-slow-reverse 45s linear infinite;
          will-change: transform;
        }
        .orbit-3 {
          transform-origin: 300px 400px;
          animation: rotate-slow 55s linear infinite;
          will-change: transform;
        }
        .pulse-dot {
          animation: pulse-opacity 2.5s ease-in-out infinite;
          will-change: opacity;
        }
        .hub-glow {
          animation: hub-pulse 3s ease-in-out infinite;
          will-change: opacity;
        }
      `}</style>

      <svg
        width="100%"
        height="100%"
        viewBox="0 0 600 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full scale-110"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          {/* Simplified glow filter - less blur = better perf */}
          <filter id="glow-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Radial gradient for hub */}
          <radialGradient id="hubGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={colors.gradientStart} />
            <stop offset="100%" stopColor={colors.gradientEnd} />
          </radialGradient>

          {/* Node gradient */}
          <radialGradient id="nodeGradient" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor={colors.gradientStart} />
            <stop offset="100%" stopColor={colors.gradientEnd} />
          </radialGradient>
        </defs>

        {/* === ORBITAL RINGS === */}
        <g>
          {/* Outer orbit */}
          <circle
            className="orbit-1"
            cx="300"
            cy="400"
            r="220"
            fill="none"
            stroke={colors.orbitStroke}
            strokeWidth="1.5"
            strokeDasharray="3 6"
          />
          {/* Middle orbit */}
          <circle
            className="orbit-2"
            cx="300"
            cy="400"
            r="180"
            fill="none"
            stroke={colors.orbitStrokeAlt}
            strokeWidth="1.5"
            strokeDasharray="3 6"
          />
          {/* Inner orbit */}
          <circle
            className="orbit-3"
            cx="300"
            cy="400"
            r="145"
            fill="none"
            stroke={colors.orbitStrokeLight}
            strokeWidth="1"
            strokeDasharray="2 8"
          />
        </g>

        {/* === CONNECTION LINES === */}
        <g>
          {CONNECTIONS.map((line, i) => (
            <line
              key={`line-${i}`}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke={colors.lineStroke}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          ))}
        </g>

        {/* === CENTRAL HUB === */}
        <g className="hub-glow">
          {/* Outer ring */}
          <circle
            cx="300"
            cy="400"
            r="85"
            fill="none"
            stroke={colors.hubOuter}
            strokeWidth="2"
          />
          {/* Middle ring with gradient */}
          <circle
            cx="300"
            cy="400"
            r="55"
            fill="url(#hubGradient)"
            stroke={colors.hubMiddle}
            strokeWidth="2.5"
          />
          {/* Inner core */}
          <circle
            cx="300"
            cy="400"
            r="28"
            fill={colors.hubInner}
            stroke={colors.hubCore}
            strokeWidth="2"
          />
          {/* Core dot */}
          <circle cx="300" cy="400" r="8" fill={colors.hubCore} />
          {/* Hub markings */}
          <line x1="280" y1="400" x2="290" y2="400" stroke={colors.nodeDetail} strokeWidth="1.5" />
          <line x1="310" y1="400" x2="320" y2="400" stroke={colors.nodeDetail} strokeWidth="1.5" />
          <line x1="300" y1="380" x2="300" y2="390" stroke={colors.nodeDetail} strokeWidth="1.5" />
          <line x1="300" y1="410" x2="300" y2="420" stroke={colors.nodeDetail} strokeWidth="1.5" />
        </g>

        {/* === PROCESSING NODES === */}
        <g>
          {NODES.map((node, i) => (
            <g key={`node-${i}`}>
              {/* Node background */}
              <circle
                cx={node.x}
                cy={node.y}
                r="32"
                fill="url(#nodeGradient)"
                stroke={colors.nodeStroke}
                strokeWidth="2"
              />
              {/* Inner ring */}
              <circle
                cx={node.x}
                cy={node.y}
                r="22"
                fill="none"
                stroke={colors.nodeDetail}
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              {/* Center dot */}
              <circle cx={node.x} cy={node.y} r="6" fill={colors.nodeDetail} />
              
              {/* Node details - unique per node */}
              {i === 0 && (
                <>
                  <line x1={node.x - 20} y1={node.y - 5} x2={node.x + 20} y2={node.y - 5} stroke={colors.nodeDetail} strokeWidth="1.5" />
                  <line x1={node.x - 20} y1={node.y} x2={node.x + 20} y2={node.y} stroke={colors.nodeDetail} strokeWidth="1.5" />
                  <line x1={node.x - 20} y1={node.y + 5} x2={node.x + 15} y2={node.y + 5} stroke={colors.nodeDetail} strokeWidth="1.5" />
                </>
              )}
              {i === 1 && (
                <>
                  <rect x={node.x - 15} y={node.y - 8} width="8" height="3" fill={colors.nodeDetail} rx="0.5" />
                  <rect x={node.x - 5} y={node.y - 8} width="12" height="3" fill={colors.nodeDetail} rx="0.5" />
                  <rect x={node.x - 15} y={node.y - 3} width="15" height="3" fill={colors.nodeDetail} rx="0.5" />
                  <rect x={node.x - 15} y={node.y + 2} width="10" height="3" fill={colors.nodeDetail} rx="0.5" />
                </>
              )}
              {i === 2 && (
                <>
                  <path d={`M ${node.x - 15} ${node.y - 10} A 18 18 0 0 1 ${node.x} ${node.y - 18}`} stroke={colors.nodeDetail} strokeWidth="1.5" fill="none" />
                  <path d={`M ${node.x + 15} ${node.y - 10} A 18 18 0 0 0 ${node.x} ${node.y - 18}`} stroke={colors.nodeDetail} strokeWidth="1.5" fill="none" />
                </>
              )}
              {i === 3 && (
                <>
                  <line x1={node.x - 12} y1={node.y - 8} x2={node.x + 12} y2={node.y - 8} stroke={colors.nodeDetail} strokeWidth="1.5" />
                  <line x1={node.x - 8} y1={node.y} x2={node.x + 8} y2={node.y} stroke={colors.nodeDetail} strokeWidth="1.5" />
                  <line x1={node.x - 12} y1={node.y + 8} x2={node.x + 12} y2={node.y + 8} stroke={colors.nodeDetail} strokeWidth="1.5" />
                </>
              )}
              {i === 4 && (
                <>
                  <circle cx={node.x} cy={node.y} r="16" fill="none" stroke={colors.nodeDetail} strokeWidth="1" />
                  <line x1={node.x - 8} y1={node.y - 7} x2={node.x + 8} y2={node.y - 7} stroke={colors.nodeDetail} strokeWidth="1.5" />
                  <line x1={node.x - 8} y1={node.y - 2} x2={node.x + 5} y2={node.y - 2} stroke={colors.nodeDetail} strokeWidth="1.5" />
                  <line x1={node.x - 8} y1={node.y + 3} x2={node.x + 8} y2={node.y + 3} stroke={colors.nodeDetail} strokeWidth="1.5" />
                </>
              )}
              {i === 5 && (
                <>
                  <rect x={node.x - 14} y={node.y - 7} width="6" height="2.5" fill={colors.nodeDetail} rx="0.5" />
                  <rect x={node.x - 6} y={node.y - 7} width="10" height="2.5" fill={colors.nodeDetail} rx="0.5" />
                  <rect x={node.x - 14} y={node.y - 2} width="12" height="2.5" fill={colors.nodeDetail} rx="0.5" />
                  <rect x={node.x - 14} y={node.y + 3} width="9" height="2.5" fill={colors.nodeDetail} rx="0.5" />
                </>
              )}
            </g>
          ))}
        </g>

        {/* === NODE LABELS === */}
        <g>
          {NODES.map((node, i) => {
            const labelY = node.y < 400 ? node.y - 55 : node.y + 65;
            const sublabelY = node.y < 400 ? node.y - 43 : node.y + 77;
            const textX = node.x === 120 ? 120 : node.x === 480 ? 480 : node.x;
            
            return (
              <g key={`label-${i}`}>
                <text
                  x={textX}
                  y={labelY}
                  fill={colors.textPrimary}
                  fontSize="10"
                  fontFamily="system-ui, sans-serif"
                  letterSpacing="1.2"
                  textAnchor="middle"
                  fontWeight="500"
                  style={{ textTransform: "uppercase" }}
                >
                  {node.label}
                </text>
                <text
                  x={textX}
                  y={sublabelY}
                  fill={colors.textSecondary}
                  fontSize="8"
                  fontFamily="system-ui, sans-serif"
                  letterSpacing="0.3"
                  textAnchor="middle"
                >
                  {node.sublabel}
                </text>
              </g>
            );
          })}
        </g>

        {/* === PULSE DOTS (Data flow indicators) === */}
        <g>
          {PULSE_POINTS.map((point, i) => (
            <circle
              key={`pulse-${i}`}
              className="pulse-dot"
              cx={point.cx}
              cy={point.cy}
              r="5"
              fill={colors.pulseFill}
              filter="url(#glow-soft)"
              style={{ animationDelay: `${point.delay}s` }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}

// Memoize to prevent re-renders unless isDark changes
export const BrandIllustration = memo(BrandIllustrationComponent);
export default BrandIllustration;
