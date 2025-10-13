import React, { useEffect, useRef } from 'react';

export default function ParticlesCanvas() {
  const canvasRef = useRef<HTMLCanvasElement|null>(null);
  const rafRef = useRef<number| null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const c = canvasRef.current!;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    if (!ctx) return;
    
    let width: number, height: number, dpr: number;
    let particles: any[] = [];
    const MAX_DISTANCE = 120; // max distance to draw a line

    const handleMouseMove = (event: MouseEvent) => {
        mouseRef.current.x = event.clientX;
        mouseRef.current.y = event.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const setup = () => {
        width = c.clientWidth;
        height = c.clientHeight;
        dpr = window.devicePixelRatio || 1;
        c.width = Math.floor(width * dpr);
        c.height = Math.floor(height * dpr);
        ctx.scale(dpr, dpr);

        particles.length = 0;
        const area = width * height;
        const count = Math.max(40, Math.floor(area * 0.00015));
        for (let i = 0; i < count; i++) {
            particles.push({
              x: Math.random() * width,
              y: Math.random() * height,
              z: 0.3 + Math.random() * 0.7, // depth for parallax
              r: 0.8 + Math.random() * 1.6, // radius
              vx: (Math.random() - 0.5) * 0.1,
              vy: (Math.random() - 0.5) * 0.1,
            });
        }
    };

    function draw() {
      if (!ctx || c.width === 0 || c.height === 0) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      ctx.clearRect(0,0,width,height);
      
      const mouseX = mouseRef.current.x;
      const mouseY = mouseRef.current.y;
      
      particles.forEach(p => {
        const parallaxX = (mouseX - width / 2) / (width / 2) * -1 * p.z * 4;
        const parallaxY = (mouseY - height / 2) / (height / 2) * -1 * p.z * 4;

        p.x += p.vx + parallaxX;
        p.y += p.vy + parallaxY;
        
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 255, ${0.3 * p.z})`;
        ctx.fill();
      });
      
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
              const p1 = particles[i];
              const p2 = particles[j];
              const dist = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

              if (dist < MAX_DISTANCE) {
                  const opacity = 1 - (dist / MAX_DISTANCE);
                  ctx.strokeStyle = `rgba(0, 255, 255, ${opacity * 0.2})`;
                  ctx.beginPath();
                  ctx.moveTo(p1.x, p1.y);
                  ctx.lineTo(p2.x, p2.y);
                  ctx.stroke();
              }
          }
      }

      rafRef.current = requestAnimationFrame(draw);
    }
    
    setup();
    draw();

    let resizeTimeout: number;
    const onResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = window.setTimeout(() => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            setup();
            draw();
        }, 100);
    };
    window.addEventListener('resize', onResize);
    
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0 bg-[#0A0F1E]" />;
}