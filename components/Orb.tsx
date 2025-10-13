import React, { useEffect, useRef, useCallback } from 'react';

// This component uses the global `gsap` object, which is expected to be
// available in the window scope, loaded from a CDN script in index.html.
declare const gsap: any;

export type OrbState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error' | 'privacy';

interface Props {
  state?: OrbState;
  amplitude?: number; // 0..1 audio envelope
  sentiment?: number; // -1..1 for color shifts
  onClick?: () => void;
  size?: number; // px diameter
}

export default function Orb({ state = 'idle', amplitude = 0, sentiment = 0, onClick, size = 360 }: Props) {
  const rootRef = useRef<HTMLDivElement|null>(null);
  const innerRef = useRef<HTMLDivElement|null>(null);
  const ringsRef = useRef<HTMLDivElement|null>(null);
  const textRef = useRef<HTMLDivElement|null>(null);

  // color mapping
  const calm = '#00FFFF';
  const neutral = '#007BFF';
  const alert = '#9B59B6';

  const colorForSentiment = useCallback((s: number) => {
    if (s > 0.15) return calm;
    if (s < -0.2) return alert;
    return neutral;
  }, []);

  useEffect(() => {
    if (!rootRef.current || !innerRef.current || !ringsRef.current || typeof gsap === 'undefined') return;
    const root = rootRef.current;
    const inner = innerRef.current;
    const rings = ringsRef.current;
    const text = textRef.current;

    gsap.killTweensOf([inner, rings.children, root]);
    if (text) gsap.killTweensOf(text);

    // Default text state
    if (text) {
      text.textContent = '';
      gsap.to(text, { opacity: 0, duration: 0.2 });
    }

    if (state === 'idle') {
      gsap.to(inner, {
        scale: 1.02,
        duration: 2.4,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut'
      });
      gsap.to(root, { boxShadow: '0 0 48px rgba(0,255,255,0.06)', duration: 2.4 });
    } else {
      // For most non-idle states, reset scale. 'listening' will override this.
      gsap.to(inner, { scale: 1, duration: 0.18 });
    }

    const color = colorForSentiment(sentiment);
    gsap.to(inner, { boxShadow: `inset 0 24px 64px rgba(0,0,0,0.6), 0 0 120px ${color}22`, duration: 0.5 });
    
    if (state === 'listening') {
      gsap.to(rings.children, { rotate: 360, duration: 9, repeat: -1, ease: 'linear' });
      gsap.to(root, { boxShadow: `0 0 80px ${color}55`, duration: 0.5 });
      if (text) {
        text.textContent = 'Listening';
        gsap.to(text, { opacity: 1, duration: 0.5 });
      }
      // Add gentle pulsation for the listening state
      gsap.to(inner, {
        scale: 1.04,
        duration: 1.2,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut'
      });
    } else if (state === 'processing') {
      gsap.to(rings.children, { rotate: -360, duration: 6, repeat: -1, ease: 'linear' });
      gsap.to(root, { boxShadow: `0 0 80px ${color}55`, duration: 0.5 });
      if (text) {
        text.textContent = 'Processing';
        gsap.to(text, { opacity: 1, duration: 0.5 });
      }
    } else if (state === 'speaking') {
      // amplitude drives scale in separate effect
      gsap.to(root, { boxShadow: `0 0 90px ${color}88`, duration: 0.3 });
    } else if (state === 'error') {
      gsap.to(root, { boxShadow: `0 0 80px #FF4D5A88`, duration: 0.3 });
      gsap.fromTo(inner, { x: 0 }, { x: -4, duration: 0.08, yoyo: true, repeat: 5, ease: 'power2.inOut', onComplete: () => gsap.set(inner, {x: 0}) });
    } else if (state === 'privacy') {
      gsap.to(root, { boxShadow: `0 0 8px rgba(0,0,0,0.3)`, duration: 0.5 });
    }

  }, [state, sentiment, colorForSentiment]);

  useEffect(() => {
    if (typeof gsap === 'undefined' || state !== 'speaking') return;
    const inner = innerRef.current;
    const root = rootRef.current;
    if (!inner || !root) return;
    
    const scale = 1 + Math.min(0.08, amplitude * 0.8);
    gsap.to(inner, { scale: scale, duration: 0.05, ease: 'power1.out' });
    
    const glow = Math.min(1, amplitude * 2);
    gsap.to(root, {
        boxShadow: `0 0 ${24 + glow*80}px rgba(0,255,255,${0.1 + glow*0.4})`,
        duration: 0.1
    });
  }, [amplitude, state]);

  return (
    <div
      ref={rootRef}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label="Atlas core"
      className="relative rounded-full flex items-center justify-center"
      style={{
        width: size,
        height: size,
        margin: '0 auto',
        cursor: 'pointer',
        background: 'radial-gradient(closest-side, rgba(255,255,255,0.02), rgba(0,0,0,0.75))',
        transition: 'box-shadow 0.5s ease'
      }}
    >
      <div ref={ringsRef} className="absolute inset-0 rounded-full pointer-events-none">
        {[0,1,2,3].map((i) => (
          <div key={i} style={{
            position:'absolute', left: 0, top: 0, right: 0, bottom: 0,
            borderRadius: '9999px',
            boxShadow: `inset 0 0 ${8+i*6}px rgba(0,255,255,${0.02+i*0.02})`,
            transform: `scale(${1 + i*0.08})`,
            border: `1px solid rgba(0,255,255,${0.03 + i*0.01})`,
            mixBlendMode: 'screen',
            pointerEvents: 'none'
          }} />
        ))}
      </div>

      <div ref={innerRef} className="relative rounded-full overflow-hidden flex items-center justify-center"
           style={{
             width: '70%',
             height: '70%',
             background: 'radial-gradient(ellipse at 30% 30%, rgba(0,255,255,0.06), rgba(0,0,0,0.85))',
             borderRadius: '9999px',
             border: '1px solid rgba(255,255,255,0.03)',
             transition: 'box-shadow 0.5s ease'
           }}>
        <div aria-hidden style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle at 20% 20%, rgba(0,255,255,0.06), transparent 8%), radial-gradient(circle at 80% 80%, rgba(0,123,255,0.04), transparent 12%)`,
            mixBlendMode: 'screen',
            transform: 'translateZ(0)'
        }} />
        <div ref={textRef} className="text-xs text-white/40 tracking-wider select-none opacity-0" style={{fontFamily: 'ui-monospace, monospace'}}></div>
      </div>
    </div>
  );
}