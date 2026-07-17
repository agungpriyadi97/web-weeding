'use client';

import React, { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number; // percentage
  size: number; // pixels
  delay: number; // seconds
  duration: number; // seconds
  color?: string;
  driftDuration: number;
  rotationSpeed?: number;
}

interface PremiumEffectsProps {
  effect: 'sakura' | 'rose' | 'confetti' | 'sparkle' | 'snow' | 'bubble' | 'fireflies' | 'lantern' | 'none';
}

export default function PremiumEffects({ effect }: PremiumEffectsProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (effect === 'none') {
      setParticles([]);
      return;
    }

    const count = effect === 'sparkle' || effect === 'fireflies' ? 35 : 20;
    const colors = {
      confetti: ['#FFC72C', '#FF5E00', '#00A859', '#6366F1', '#EC4899', '#3B82F6'],
      sparkle: ['#FFD700', '#FFA500', '#FFE4B5', '#FFF8DC'],
      sakura: ['#FFC0CB', '#FFB7C5', '#FFD1DC', '#FFE4E1'],
      rose: ['#FF0000', '#D30000', '#B30000', '#800000'],
      fireflies: ['#A8FF35', '#CCFF66', '#ADFF2F', '#98FB98'],
      lantern: ['#FF7A00', '#FF9F43', '#FF5722', '#FFA000'],
    };

    const newParticles = Array.from({ length: count }).map((_, i) => {
      let particleColor = '';
      if (effect === 'confetti') {
        particleColor = colors.confetti[Math.floor(Math.random() * colors.confetti.length)];
      } else if (effect === 'sparkle') {
        particleColor = colors.sparkle[Math.floor(Math.random() * colors.sparkle.length)];
      } else if (effect === 'sakura') {
        particleColor = colors.sakura[Math.floor(Math.random() * colors.sakura.length)];
      } else if (effect === 'rose') {
        particleColor = colors.rose[Math.floor(Math.random() * colors.rose.length)];
      } else if (effect === 'fireflies') {
        particleColor = colors.fireflies[Math.floor(Math.random() * colors.fireflies.length)];
      } else if (effect === 'lantern') {
        particleColor = colors.lantern[Math.floor(Math.random() * colors.lantern.length)];
      }

      return {
        id: i,
        x: Math.random() * 100,
        size: effect === 'lantern' ? Math.random() * 25 + 15 : effect === 'fireflies' ? Math.random() * 4 + 2 : Math.random() * 15 + 8,
        delay: Math.random() * -15, // Negative delay for pre-warmed particle state
        duration: effect === 'lantern' ? Math.random() * 12 + 10 : Math.random() * 8 + 6,
        color: particleColor,
        driftDuration: Math.random() * 4 + 3,
        rotationSpeed: Math.random() * 360 * (Math.random() > 0.5 ? 1 : -1),
      };
    });

    setParticles(newParticles);
  }, [effect]);

  if (effect === 'none' || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-5 overflow-hidden">
      <style>{`
        @keyframes float-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(105vh) rotate(var(--rot)); opacity: 0; }
        }
        @keyframes float-rise {
          0% { transform: translateY(105vh) rotate(0deg); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { transform: translateY(-20px) rotate(var(--rot)); opacity: 0; }
        }
        @keyframes drift {
          0%, 100% { margin-left: 0px; }
          50% { margin-left: var(--drift-dist); }
        }
        @keyframes sparkle-blink {
          0%, 100% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1); opacity: 0.8; }
        }
        @keyframes glow {
          0%, 100% { opacity: 0.3; filter: blur(1px); }
          50% { opacity: 0.9; filter: blur(3px); }
        }
        .particle-fall {
          animation: float-fall var(--dur) linear infinite;
          animation-delay: var(--delay);
        }
        .particle-rise {
          animation: float-rise var(--dur) linear infinite;
          animation-delay: var(--delay);
        }
        .particle-drift {
          animation: drift var(--drift-dur) ease-in-out infinite;
        }
        .particle-sparkle {
          animation: sparkle-blink var(--dur) ease-in-out infinite;
          animation-delay: var(--delay);
        }
      `}</style>

      {particles.map((p) => {
        const styleVariables = {
          '--dur': `${p.duration}s`,
          '--delay': `${p.delay}s`,
          '--rot': `${p.rotationSpeed || 180}deg`,
          '--drift-dur': `${p.driftDuration}s`,
          '--drift-dist': `${Math.random() > 0.5 ? 40 : -40}px`,
        } as React.CSSProperties;

        // Sparkle uses fixed absolute positions and simple blink scaling
        if (effect === 'sparkle') {
          return (
            <div
              key={p.id}
              className="absolute particle-sparkle flex items-center justify-center"
              style={{
                left: `${p.x}%`,
                top: `${Math.random() * 95}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                color: p.color,
                ...styleVariables,
              }}
            >
              <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
                <path d="M12 0l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" />
              </svg>
            </div>
          );
        }

        // Fireflies uses drift + glow + custom rises
        if (effect === 'fireflies') {
          return (
            <div
              key={p.id}
              className="absolute particle-rise"
              style={{
                left: `${p.x}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                ...styleVariables,
              }}
            >
              <div
                className="particle-drift rounded-full"
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: p.color,
                  boxShadow: `0 0 8px ${p.color}, 0 0 16px ${p.color}`,
                  animation: `glow ${Math.random() * 2 + 1}s ease-in-out infinite`,
                }}
              />
            </div>
          );
        }

        // Lantern (traditional sky lanterns)
        if (effect === 'lantern') {
          return (
            <div
              key={p.id}
              className="absolute particle-rise"
              style={{
                left: `${p.x}%`,
                width: `${p.size}px`,
                height: `${p.size * 1.3}px`,
                ...styleVariables,
              }}
            >
              <div
                className="particle-drift rounded-md relative overflow-hidden"
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: p.color,
                  opacity: 0.75,
                  boxShadow: `0 0 12px ${p.color}, 0 0 20px ${p.color}`,
                }}
              >
                {/* Glow center */}
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full blur-xs" />
              </div>
            </div>
          );
        }

        // Bubble (rising transparent circles)
        if (effect === 'bubble') {
          return (
            <div
              key={p.id}
              className="absolute particle-rise"
              style={{
                left: `${p.x}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                ...styleVariables,
              }}
            >
              <div className="particle-drift w-full h-full rounded-full border border-white/40 bg-white/10 shadow-inner relative">
                <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-white/70 rounded-full" />
              </div>
            </div>
          );
        }

        // Snow
        if (effect === 'snow') {
          return (
            <div
              key={p.id}
              className="absolute particle-fall"
              style={{
                left: `${p.x}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                ...styleVariables,
              }}
            >
              <div className="particle-drift w-full h-full rounded-full bg-white/80 blur-[0.5px]" />
            </div>
          );
        }

        // Sakura & Rose Petals
        if (effect === 'sakura' || effect === 'rose') {
          return (
            <div
              key={p.id}
              className="absolute particle-fall"
              style={{
                left: `${p.x}%`,
                width: `${p.size}px`,
                height: `${p.size * 0.8}px`,
                ...styleVariables,
              }}
            >
              <div
                className="particle-drift"
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: p.color,
                  borderRadius: '100% 0% 100% 100%', // Petal shape
                  transform: 'rotate(45deg)',
                }}
              />
            </div>
          );
        }

        // Confetti
        return (
          <div
            key={p.id}
            className="absolute particle-fall"
            style={{
              left: `${p.x}%`,
              width: `${p.size}px`,
              height: `${p.size * 0.5}px`,
              ...styleVariables,
            }}
          >
            <div
              className="particle-drift"
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: p.color,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
