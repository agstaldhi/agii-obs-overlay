'use client';

import React, { useEffect, useRef } from 'react';

interface ShaderCanvasProps {
  mode: string;
  config?: {
    saturation?: number;
    speed?: number;
  };
}

export default function ShaderCanvas({ mode, config }: ShaderCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const saturation = config?.saturation ?? 0.5;
  const speed = config?.speed ?? 0.3;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resizeCanvas = () => {
      canvas.width = 1920;
      canvas.height = 1080;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle and fluid state for advanced modes
    const particles: Array<{ x: number; y: number; r: number; dx: number; dy: number; c: string }> = [];
    if (mode === 'Aura Rings' || mode === 'Light Rays') {
      const satVal = Math.floor(saturation * 100);
      for (let i = 0; i < 15; i++) {
        particles.push({
          x: Math.random() * 1920,
          y: Math.random() * 1080,
          r: Math.random() * 200 + 100,
          dx: (Math.random() - 0.5) * 2,
          dy: (Math.random() - 0.5) * 2,
          c: `hsla(${200 + Math.random() * 60}, ${satVal}%, 45%, 0.15)`
        });
      }
    }

    // Digital glyph stream state for cybernetic background
    const glyphs: Array<{ x: number; y: number; speed: number; size: number; chars: string[] }> = [];
    if (mode === 'Data Glyphs') {
      const cols = Math.floor(1920 / 30);
      for (let i = 0; i < cols; i++) {
        glyphs.push({
          x: i * 30 + 15,
          y: Math.random() * -1080,
          speed: 2 + Math.random() * 4,
          size: 12 + Math.random() * 12,
          chars: Array.from({ length: 15 }, () => Math.random() > 0.5 ? '1' : '0')
        });
      }
    }

    // Cross glyph streams state
    const crossGlyphs: Array<{ x: number; y: number; speed: number; size: number; count: number }> = [];
    if (mode === 'Cross Glyphs') {
      const cols = Math.floor(1920 / 40); // slightly wider spacing
      for (let i = 0; i < cols; i++) {
        crossGlyphs.push({
          x: i * 40 + 20,
          y: Math.random() * -1080,
          speed: 1.5 + Math.random() * 3,
          size: 14 + Math.random() * 14,
          count: 8 + Math.floor(Math.random() * 8)
        });
      }
    }

    const render = () => {
      time += speed * 0.02; // adjusted for standard 60fps rate
      
      const width = canvas.width;
      const height = canvas.height;

      // Draw background base color
      ctx.fillStyle = '#080A10';
      ctx.fillRect(0, 0, width, height);

      // Rendering states based on mode
      switch (mode) {
        case 'Silk Ribbons': {
          ctx.save();
          // Draw multiple elegant waving ribbons
          for (let i = 0; i < 6; i++) {
            const grad = ctx.createLinearGradient(0, 0, width, 0);
            const satValue = Math.floor(saturation * 100);
            grad.addColorStop(0, `hsla(240, ${satValue}%, 40%, 0.0)`);
            grad.addColorStop(0.3, `hsla(${230 + i * 15}, ${satValue}%, 55%, 0.4)`);
            grad.addColorStop(0.7, `hsla(${260 + i * 20}, ${satValue}%, 45%, 0.4)`);
            grad.addColorStop(1, `hsla(320, ${satValue}%, 40%, 0.0)`);
            
            ctx.strokeStyle = grad;
            ctx.lineWidth = 4 + i * 2;
            ctx.beginPath();
            
            for (let x = 0; x <= width; x += 10) {
              const y = height * 0.5 + 
                Math.sin(x * 0.002 + time + i * 0.5) * 150 * Math.cos(x * 0.0008 - time * 0.2) +
                Math.sin(x * 0.005 - time * 0.7) * 40;
              if (x === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.stroke();
          }
          ctx.restore();
          break;
        }

        case 'Liquid Chrome': {
          ctx.save();
          // Soft fluid morphing shapes using multiple overlays
          for (let i = 0; i < 6; i++) {
            const satVal = Math.floor(saturation * 80);
            ctx.fillStyle = `hsla(${190 + i * 25}, ${satVal}%, 25%, 0.15)`;
            ctx.beginPath();
            ctx.moveTo(0, height);
            
            for (let x = 0; x <= width; x += 30) {
              const y = height * 0.35 + 
                Math.sin(x * 0.003 + time * 0.7 + i) * 180 + 
                Math.cos(x * 0.006 - time * 0.4 + i * 1.5) * 120;
              ctx.lineTo(x, y);
            }
            
            ctx.lineTo(width, height);
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();
          break;
        }

        case 'Soft Gradient': {
          ctx.save();
          // Complex mesh gradient style via radial gradient positions
          const satValue = Math.floor(saturation * 90);
          
          // Spot 1
          const x1 = width / 2 + Math.cos(time * 0.5) * (width * 0.25);
          const y1 = height / 2 + Math.sin(time * 0.7) * (height * 0.2);
          const grad1 = ctx.createRadialGradient(x1, y1, 50, x1, y1, 800);
          grad1.addColorStop(0, `hsla(260, ${satValue}%, 45%, 0.35)`);
          grad1.addColorStop(1, 'rgba(8, 10, 16, 0)');
          ctx.fillStyle = grad1;
          ctx.fillRect(0, 0, width, height);

          // Spot 2
          const x2 = width / 2 + Math.cos(time * -0.4) * (width * 0.3);
          const y2 = height / 2 + Math.sin(time * 0.6) * (height * 0.25);
          const grad2 = ctx.createRadialGradient(x2, y2, 20, x2, y2, 600);
          grad2.addColorStop(0, `hsla(210, ${satValue}%, 35%, 0.35)`);
          grad2.addColorStop(1, 'rgba(8, 10, 16, 0)');
          ctx.fillStyle = grad2;
          ctx.fillRect(0, 0, width, height);
          
          // Spot 3
          const x3 = width * 0.2 + Math.sin(time * 0.3) * 150;
          const y3 = height * 0.8 + Math.cos(time * 0.5) * 100;
          const grad3 = ctx.createRadialGradient(x3, y3, 10, x3, y3, 400);
          grad3.addColorStop(0, `hsla(280, ${satValue}%, 35%, 0.25)`);
          grad3.addColorStop(1, 'rgba(8, 10, 16, 0)');
          ctx.fillStyle = grad3;
          ctx.fillRect(0, 0, width, height);

          ctx.restore();
          break;
        }

        case 'Aura Rings': {
          ctx.save();
          // Render overlapping growing expanding aura rings
          particles.forEach((p, idx) => {
            p.x += p.dx * speed;
            p.y += p.dy * speed;
            
            // bounce
            if (p.x < 0 || p.x > width) p.dx *= -1;
            if (p.y < 0 || p.y > height) p.dy *= -1;

            const ringRad = p.r + Math.sin(time + idx) * 30;
            const grad = ctx.createRadialGradient(p.x, p.y, ringRad * 0.8, p.x, p.y, ringRad);
            grad.addColorStop(0, 'rgba(8, 10, 16, 0)');
            grad.addColorStop(0.5, p.c);
            grad.addColorStop(1, 'rgba(8, 10, 16, 0)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, ringRad, 0, Math.PI * 2);
            ctx.fill();
          });
          ctx.restore();
          break;
        }

        case 'Light Rays': {
          ctx.save();
          ctx.fillStyle = 'rgba(8, 10, 16, 0.4)';
          ctx.fillRect(0, 0, width, height);

          // Draw multiple translucent wedge shape light rays from the top left corner (0,0)
          const rayCount = 12;
          const maxAngle = Math.PI / 2; // cover bottom-right quadrant
          const satVal = Math.floor(saturation * 100);

          ctx.translate(0, 0);
          for (let i = 0; i < rayCount; i++) {
            const angleCenter = (i / rayCount) * maxAngle + Math.sin(time * 0.15 + i) * 0.05;
            const widthAngle = 0.04 + Math.cos(time * 0.2 + i) * 0.02;

            const x1 = Math.cos(angleCenter - widthAngle) * 3000;
            const y1 = Math.sin(angleCenter - widthAngle) * 3000;
            const x2 = Math.cos(angleCenter + widthAngle) * 3000;
            const y2 = Math.sin(angleCenter + widthAngle) * 3000;

            const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, 2000);
            grad.addColorStop(0, `hsla(230, ${satVal}%, 55%, 0.12)`);
            grad.addColorStop(0.5, `hsla(${230 + i * 5}, ${satVal}%, 45%, 0.06)`);
            grad.addColorStop(1, 'rgba(8,10,16,0)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();
          break;
        }

        case 'Halftone': {
          ctx.save();
          const dotSpacing = 40;
          const satVal = Math.floor(saturation * 90);
          
          ctx.fillStyle = `hsla(240, ${satVal}%, 60%, 0.3)`;
          for (let x = 20; x < width; x += dotSpacing) {
            for (let y = 20; y < height; y += dotSpacing) {
              const distance = Math.sqrt(Math.pow(x - width / 2, 2) + Math.pow(y - height / 2, 2));
              const wave = Math.sin(distance * 0.003 - time * 2) * 8 + 10;
              const maxRadius = Math.max(1, wave * saturation);
              
              ctx.beginPath();
              ctx.arc(x, y, maxRadius, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          ctx.restore();
          break;
        }

        case 'Pixel Mosaic': {
          ctx.save();
          const size = 60;
          const satVal = Math.floor(saturation * 100);
          
          for (let x = 0; x < width; x += size) {
            for (let y = 0; y < height; y += size) {
              const factorX = x / width;
              const factorY = y / height;
              const hue = (240 + factorX * 60 + factorY * 60 + Math.sin(time + factorX * 3) * 20) % 360;
              const opacity = 0.08 + Math.cos(time * 0.8 + factorX * 4 + factorY * 2) * 0.04;
              
              ctx.fillStyle = `hsla(${hue}, ${satVal}%, 40%, ${opacity})`;
              ctx.fillRect(x, y, size, size);
            }
          }
          ctx.restore();
          break;
        }

        case 'Data Glyphs': {
          ctx.save();
          const satVal = Math.floor(saturation * 100);
          glyphs.forEach((g) => {
            // Update position based on time speed factor
            g.y += g.speed * speed * 2;
            if (g.y > height) {
              g.y = -200;
              g.speed = 2 + Math.random() * 4;
            }

            // Render digital stream of binary code
            for (let i = 0; i < g.chars.length; i++) {
              const charY = g.y + i * g.size;
              if (charY < 0 || charY > height) continue;
              
              const alpha = (i / g.chars.length) * 0.18;
              const isHead = i === g.chars.length - 1;
              ctx.fillStyle = isHead 
                ? `hsla(200, ${satVal}%, 85%, 0.5)` 
                : `hsla(${200 + (charY % 30)}, ${satVal}%, 55%, ${alpha})`;
              
              ctx.font = `bold ${g.size}px monospace`;
              ctx.fillText(g.chars[i], g.x, charY);

              // Random character mutation
              if (Math.random() < 0.015) {
                g.chars[i] = Math.random() > 0.5 ? '1' : '0';
              }
            }
          });
          ctx.restore();
          break;
        }

        case 'Reeded Glass': {
          ctx.save();
          const satValue = Math.floor(saturation * 90);
          
          // 1. Draw dynamic background blobs
          const x1 = width * 0.35 + Math.cos(time * 0.3) * (width * 0.15);
          const y1 = height * 0.45 + Math.sin(time * 0.4) * (height * 0.15);
          const grad1 = ctx.createRadialGradient(x1, y1, 50, x1, y1, width * 0.4);
          grad1.addColorStop(0, `hsla(220, ${satValue}%, 40%, 0.3)`);
          grad1.addColorStop(1, 'rgba(8, 10, 16, 0)');
          ctx.fillStyle = grad1;
          ctx.fillRect(0, 0, width, height);

          const x2 = width * 0.65 + Math.cos(time * -0.25) * (width * 0.15);
          const y2 = height * 0.55 + Math.sin(time * 0.35) * (height * 0.15);
          const grad2 = ctx.createRadialGradient(x2, y2, 50, x2, y2, width * 0.4);
          grad2.addColorStop(0, `hsla(270, ${satValue}%, 40%, 0.25)`);
          grad2.addColorStop(1, 'rgba(8, 10, 16, 0)');
          ctx.fillStyle = grad2;
          ctx.fillRect(0, 0, width, height);

          // 2. Draw vertical reeded glass ribbed overlay
          const ribWidth = 24;
          for (let x = 0; x < width; x += ribWidth) {
            const ribGrad = ctx.createLinearGradient(x, 0, x + ribWidth, 0);
            ribGrad.addColorStop(0, 'rgba(8, 10, 16, 0.25)'); // shadow left
            ribGrad.addColorStop(0.2, 'rgba(255, 255, 255, 0.03)'); // shine
            ribGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)'); // highlight center
            ribGrad.addColorStop(0.8, 'rgba(8, 10, 16, 0.1)');
            ribGrad.addColorStop(1, 'rgba(8, 10, 16, 0.35)'); // shadow right/seam

            ctx.fillStyle = ribGrad;
            ctx.fillRect(x, 0, ribWidth, height);
          }
          
          // Ultra-fine glass frosting texture
          ctx.fillStyle = 'rgba(255, 255, 255, 0.01)';
          for (let x = 0; x < width; x += 4) {
            if (x % 8 === 0) {
              ctx.fillRect(x, 0, 1, height);
            }
          }

          ctx.restore();
          break;
        }

        case 'Cross Glyphs': {
          ctx.save();
          const satVal = Math.floor(saturation * 100);
          crossGlyphs.forEach((g) => {
            // Update position
            g.y += g.speed * speed * 2;
            if (g.y > height) {
              g.y = -200;
              g.speed = 1.5 + Math.random() * 3;
            }

            // Draw stream of Latin crosses
            for (let i = 0; i < g.count; i++) {
              const crossY = g.y + i * (g.size * 1.5);
              if (crossY < -50 || crossY > height + 50) continue;

              const alpha = (i / g.count) * 0.25;
              const isHead = i === g.count - 1;
              
              const hue = 42; // Warm golden color
              
              ctx.strokeStyle = isHead
                ? `hsla(${hue}, ${satVal}%, 85%, 0.65)`
                : `hsla(${hue}, ${satVal}%, 50%, ${alpha})`;
              
              ctx.lineWidth = Math.max(1.5, g.size * 0.15);
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
              
              // Draw Latin Cross
              ctx.beginPath();
              // Vertical bar
              ctx.moveTo(g.x, crossY - g.size / 2);
              ctx.lineTo(g.x, crossY + g.size / 2);
              // Horizontal bar (Latin Cross ratio: slightly above center)
              const crossW = g.size * 0.6;
              const horizY = crossY - g.size * 0.12;
              ctx.moveTo(g.x - crossW / 2, horizY);
              ctx.lineTo(g.x + crossW / 2, horizY);
              ctx.stroke();

              // Add a soft glow behind the head
              if (isHead) {
                ctx.save();
                ctx.shadowBlur = 15;
                ctx.shadowColor = `hsla(${hue}, ${satVal}%, 65%, 0.5)`;
                ctx.beginPath();
                ctx.moveTo(g.x, crossY - g.size / 2);
                ctx.lineTo(g.x, crossY + g.size / 2);
                ctx.moveTo(g.x - crossW / 2, horizY);
                ctx.lineTo(g.x + crossW / 2, horizY);
                ctx.stroke();
                ctx.restore();
              }
            }
          });
          ctx.restore();
          break;
        }

        default: {
          // Standard dark page color
          break;
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, [mode, saturation, speed]);

  return (
    <canvas
      ref={canvasRef}
      className="overlay-shader-canvas"
      style={{ display: 'block', pointerEvents: 'none' }}
    />
  );
}
