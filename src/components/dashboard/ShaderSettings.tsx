'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Layers, Play, X, Copy, Check } from 'lucide-react';

interface ShaderSettingsProps {
  workspaceId: string;
  activeState: any;
  updateState: (newState: any) => Promise<void>;
}

const SHADER_MODES = [
  'Silk Ribbons',
  'Liquid Chrome',
  'Soft Gradient',
  'Aura Rings',
  'Light Rays',
  'Halftone',
  'Data Glyphs',
  'Reeded Glass',
  'Pixel Mosaic',
  'Cross Glyphs'
];

export default function ShaderSettings({ workspaceId, activeState, updateState }: ShaderSettingsProps) {
  const [mode, setMode] = useState(activeState?.shader_mode || 'Silk Ribbons');
  const [saturation, setSaturation] = useState(activeState?.shader_config?.saturation ?? 0.5);
  const [speed, setSpeed] = useState(activeState?.shader_config?.speed ?? 0.3);
  const [presetCode, setPresetCode] = useState('LMN1AAAB-SRB');
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync state if it changed externally
  useEffect(() => {
    if (activeState?.shader_mode) {
      setMode(activeState.shader_mode);
    }
    if (activeState?.shader_config) {
      setSaturation(activeState.shader_config.saturation);
      setSpeed(activeState.shader_config.speed);
    }
  }, [activeState]);

  // Canvas local preview animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || 400;
      canvas.height = 160;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle/stream state for preview (scaled down version of overlay)
    const particles: Array<{ x: number; y: number; r: number; dx: number; dy: number; c: string }> = [];
    if (mode === 'Aura Rings' || mode === 'Light Rays') {
      const satVal = Math.floor(saturation * 100);
      for (let i = 0; i < 8; i++) {
        particles.push({
          x: Math.random() * (canvas.width || 400),
          y: Math.random() * 160,
          r: Math.random() * 40 + 20,
          dx: (Math.random() - 0.5) * 1.2,
          dy: (Math.random() - 0.5) * 1.2,
          c: `hsla(${200 + Math.random() * 60}, ${satVal}%, 45%, 0.15)`
        });
      }
    }

    const glyphs: Array<{ x: number; y: number; speed: number; size: number; chars: string[] }> = [];
    if (mode === 'Data Glyphs') {
      const cols = Math.floor((canvas.width || 400) / 15);
      for (let i = 0; i < cols; i++) {
        glyphs.push({
          x: i * 15 + 7,
          y: Math.random() * -160,
          speed: 1 + Math.random() * 2,
          size: 6 + Math.random() * 6,
          chars: Array.from({ length: 10 }, () => Math.random() > 0.5 ? '1' : '0')
        });
      }
    }

    const crossGlyphs: Array<{ x: number; y: number; speed: number; size: number; count: number }> = [];
    if (mode === 'Cross Glyphs') {
      const cols = Math.floor((canvas.width || 400) / 20); // slightly wider for preview
      for (let i = 0; i < cols; i++) {
        crossGlyphs.push({
          x: i * 20 + 10,
          y: Math.random() * -160,
          speed: 0.8 + Math.random() * 1.5,
          size: 8 + Math.random() * 8,
          count: 5 + Math.floor(Math.random() * 5)
        });
      }
    }

    const render = () => {
      time += speed * 0.05;
      
      const width = canvas.width;
      const height = canvas.height;

      // Draw background
      ctx.fillStyle = '#080A10';
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      // Draw grid lines
      ctx.strokeStyle = 'rgba(39, 45, 66, 0.15)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();

      // Render custom styles based on selected mode
      if (mode === 'Silk Ribbons') {
        // Draw elegant flowing curves
        ctx.lineWidth = 3;
        for (let i = 0; i < 4; i++) {
          const grad = ctx.createLinearGradient(0, 0, width, 0);
          const satValue = Math.floor(saturation * 100);
          grad.addColorStop(0, `hsla(240, ${satValue}%, 50%, 0.1)`);
          grad.addColorStop(0.5, `hsla(${240 + i * 20}, ${satValue}%, 60%, 0.7)`);
          grad.addColorStop(1, `hsla(300, ${satValue}%, 50%, 0.1)`);
          
          ctx.strokeStyle = grad;
          ctx.beginPath();
          for (let x = 0; x < width; x++) {
            const y = height / 2 + 
              Math.sin(x * 0.005 + time + i) * 30 * Math.cos(x * 0.002 - time * 0.5) +
              Math.sin(x * 0.01 - time * 1.5) * 10;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      } else if (mode === 'Liquid Chrome') {
        // Draw metallic liquid contours
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = `hsla(${200 + i * 15}, ${Math.floor(saturation * 80)}%, 30%, 0.25)`;
          ctx.beginPath();
          ctx.moveTo(0, height);
          for (let x = 0; x <= width; x += 10) {
            const y = height * 0.4 + 
              Math.sin(x * 0.008 + time + i) * 20 + 
              Math.cos(x * 0.015 - time) * 15;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(width, height);
          ctx.closePath();
          ctx.fill();
        }
      } else if (mode === 'Soft Gradient') {
        // Blurring gradients
        const grad = ctx.createRadialGradient(
          width / 2 + Math.cos(time) * (width * 0.3),
          height / 2 + Math.sin(time * 0.8) * (height * 0.3),
          10,
          width / 2,
          height / 2,
          width * 0.6
        );
        const satValue = Math.floor(saturation * 100);
        grad.addColorStop(0, `hsla(260, ${satValue}%, 40%, 0.4)`);
        grad.addColorStop(0.6, `hsla(200, ${satValue}%, 20%, 0.2)`);
        grad.addColorStop(1, 'rgba(8, 10, 16, 0.9)');
        
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      } else if (mode === 'Aura Rings') {
        // Render overlapping growing expanding aura rings
        particles.forEach((p, idx) => {
          p.x += p.dx * speed;
          p.y += p.dy * speed;
          
          if (p.x < 0 || p.x > width) p.dx *= -1;
          if (p.y < 0 || p.y > height) p.dy *= -1;

          const ringRad = p.r + Math.sin(time + idx) * 10;
          const grad = ctx.createRadialGradient(p.x, p.y, ringRad * 0.8, p.x, p.y, ringRad);
          grad.addColorStop(0, 'rgba(8, 10, 16, 0)');
          grad.addColorStop(0.5, p.c);
          grad.addColorStop(1, 'rgba(8, 10, 16, 0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, ringRad, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (mode === 'Light Rays') {
        ctx.fillStyle = 'rgba(8, 10, 16, 0.4)';
        ctx.fillRect(0, 0, width, height);

        const rayCount = 10;
        const maxAngle = Math.PI / 2;
        const satVal = Math.floor(saturation * 100);

        for (let i = 0; i < rayCount; i++) {
          const angleCenter = (i / rayCount) * maxAngle + Math.sin(time * 0.15 + i) * 0.05;
          const widthAngle = 0.04 + Math.cos(time * 0.2 + i) * 0.02;

          const x1 = Math.cos(angleCenter - widthAngle) * 1000;
          const y1 = Math.sin(angleCenter - widthAngle) * 1000;
          const x2 = Math.cos(angleCenter + widthAngle) * 1000;
          const y2 = Math.sin(angleCenter + widthAngle) * 1000;

          const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, 800);
          grad.addColorStop(0, `hsla(230, ${satVal}%, 55%, 0.15)`);
          grad.addColorStop(0.5, `hsla(${230 + i * 5}, ${satVal}%, 45%, 0.08)`);
          grad.addColorStop(1, 'rgba(8,10,16,0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.closePath();
          ctx.fill();
        }
      } else if (mode === 'Halftone') {
        const dotSpacing = 16;
        const satVal = Math.floor(saturation * 90);
        ctx.fillStyle = `hsla(240, ${satVal}%, 60%, 0.3)`;
        for (let x = 8; x < width; x += dotSpacing) {
          for (let y = 8; y < height; y += dotSpacing) {
            const distance = Math.sqrt(Math.pow(x - width / 2, 2) + Math.pow(y - height / 2, 2));
            const wave = Math.sin(distance * 0.01 - time * 2) * 3 + 4;
            const maxRadius = Math.max(0.5, wave * saturation);
            
            ctx.beginPath();
            ctx.arc(x, y, maxRadius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (mode === 'Pixel Mosaic') {
        const size = 20;
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
      } else if (mode === 'Data Glyphs') {
        const satVal = Math.floor(saturation * 100);
        glyphs.forEach((g) => {
          g.y += g.speed * speed * 2;
          if (g.y > height) {
            g.y = -60;
            g.speed = 1 + Math.random() * 2;
          }

          for (let i = 0; i < g.chars.length; i++) {
            const charY = g.y + i * g.size;
            if (charY < 0 || charY > height) continue;
            
            const alpha = (i / g.chars.length) * 0.18;
            const isHead = i === g.chars.length - 1;
            ctx.fillStyle = isHead 
              ? `hsla(200, ${satVal}%, 85%, 0.5)` 
              : `hsla(${200 + (charY % 20)}, ${satVal}%, 55%, ${alpha})`;
            
            ctx.font = `bold ${g.size}px monospace`;
            ctx.fillText(g.chars[i], g.x, charY);

            if (Math.random() < 0.02) {
              g.chars[i] = Math.random() > 0.5 ? '1' : '0';
            }
          }
        });
      } else if (mode === 'Reeded Glass') {
        const satValue = Math.floor(saturation * 90);
        
        // Background soft gradient
        const x1 = width * 0.35 + Math.cos(time * 0.3) * (width * 0.15);
        const y1 = height * 0.45 + Math.sin(time * 0.4) * (height * 0.15);
        const grad1 = ctx.createRadialGradient(x1, y1, 10, x1, y1, width * 0.4);
        grad1.addColorStop(0, `hsla(220, ${satValue}%, 40%, 0.3)`);
        grad1.addColorStop(1, 'rgba(8, 10, 16, 0)');
        ctx.fillStyle = grad1;
        ctx.fillRect(0, 0, width, height);

        const x2 = width * 0.65 + Math.cos(time * -0.25) * (width * 0.15);
        const y2 = height * 0.55 + Math.sin(time * 0.35) * (height * 0.15);
        const grad2 = ctx.createRadialGradient(x2, y2, 10, x2, y2, width * 0.4);
        grad2.addColorStop(0, `hsla(270, ${satValue}%, 40%, 0.25)`);
        grad2.addColorStop(1, 'rgba(8, 10, 16, 0)');
        ctx.fillStyle = grad2;
        ctx.fillRect(0, 0, width, height);

        // Vertical ridges overlay
        const ribWidth = 12;
        for (let x = 0; x < width; x += ribWidth) {
          const ribGrad = ctx.createLinearGradient(x, 0, x + ribWidth, 0);
          ribGrad.addColorStop(0, 'rgba(8, 10, 16, 0.25)');
          ribGrad.addColorStop(0.2, 'rgba(255, 255, 255, 0.03)');
          ribGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)');
          ribGrad.addColorStop(0.8, 'rgba(8, 10, 16, 0.1)');
          ribGrad.addColorStop(1, 'rgba(8, 10, 16, 0.35)');

          ctx.fillStyle = ribGrad;
          ctx.fillRect(x, 0, ribWidth, height);
        }
      } else if (mode === 'Cross Glyphs') {
        const satVal = Math.floor(saturation * 100);
        crossGlyphs.forEach((g) => {
          g.y += g.speed * speed * 2;
          if (g.y > height) {
            g.y = -40;
            g.speed = 0.8 + Math.random() * 1.5;
          }

          for (let i = 0; i < g.count; i++) {
            const crossY = g.y + i * (g.size * 1.5);
            if (crossY < -20 || crossY > height + 20) continue;

            const alpha = (i / g.count) * 0.25;
            const isHead = i === g.count - 1;
            
            const hue = 42; // Warm gold
            
            ctx.strokeStyle = isHead
              ? `hsla(${hue}, ${satVal}%, 85%, 0.65)`
              : `hsla(${hue}, ${satVal}%, 50%, ${alpha})`;
            
            ctx.lineWidth = Math.max(1.0, g.size * 0.15);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            // Draw Latin Cross
            ctx.beginPath();
            // Vertical bar
            ctx.moveTo(g.x, crossY - g.size / 2);
            ctx.lineTo(g.x, crossY + g.size / 2);
            // Horizontal bar
            const crossW = g.size * 0.6;
            const horizY = crossY - g.size * 0.12;
            ctx.moveTo(g.x - crossW / 2, horizY);
            ctx.lineTo(g.x + crossW / 2, horizY);
            ctx.stroke();
          }
        });
      } else {
        // Fallback wave pattern (if any other unregistered mode)
        ctx.strokeStyle = `hsla(240, ${Math.floor(saturation * 100)}%, 60%, 0.5)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x < width; x++) {
          const y = height / 2 + Math.sin(x * 0.02 + time) * 20;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, [mode, saturation, speed]);

  const handleActivate = async () => {
    await updateState({
      shader_mode: mode,
      overlay_type: 'shader', // will activate shader screen
      is_cleared: false,
      shader_active: true,
      shader_config: {
        saturation,
        speed
      }
    });
  };

  const handleDeactivate = async () => {
    await updateState({
      shader_active: false
    });
  };

  const handleCopyURL = () => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/overlay/shader?w=${workspaceId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate a mock code based on values
  useEffect(() => {
    const modeAbbr = mode.split(' ').map((w: string) => w[0]).join('');
    const satHex = Math.floor(saturation * 255).toString(16).toUpperCase().padStart(2, '0');
    const spdHex = Math.floor(speed * 255).toString(16).toUpperCase().padStart(2, '0');
    setPresetCode(`LMN1-${modeAbbr}-${satHex}${spdHex}`);
  }, [mode, saturation, speed]);

  return (
    <div className="shader-settings">
      <style jsx>{`
        .shader-settings {
          display: flex;
          flex-direction: column;
          gap: var(--space-xl);
          background-color: var(--bg-2);
          border: 1px solid var(--bg-4);
          border-radius: var(--radius-card);
          padding: var(--space-lg);
          box-shadow: var(--shadow-1);
        }

        .shader-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-sm);
        }

        .shader-option {
          background-color: var(--bg-1);
          border: 1px solid var(--bg-4);
          color: var(--t2);
          padding: 10px;
          border-radius: 8px;
          cursor: pointer;
          font-family: inherit;
          font-size: 12px;
          text-align: left;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .shader-option:hover {
          border-color: var(--t3);
          color: var(--t1);
        }

        .shader-option.active {
          border-color: var(--accent);
          background-color: var(--accent-bg);
          color: var(--t1);
          font-weight: 500;
        }

        .radio-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 1px solid var(--t3);
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .shader-option.active .radio-dot {
          border-color: var(--accent);
        }
        .radio-dot::after {
          content: '';
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--accent);
          transform: scale(0);
          transition: transform 0.1s ease;
        }
        .shader-option.active .radio-dot::after {
          transform: scale(1);
        }

        .control-sliders {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .slider-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .slider-header {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--t2);
        }

        .range-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: var(--bg-4);
          outline: none;
          cursor: pointer;
        }
        .range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
          transition: transform 0.1s ease;
        }
        .range-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }

        .preset-row {
          display: flex;
          gap: var(--space-sm);
        }

        .canvas-preview-container {
          position: relative;
          border-radius: var(--radius-card);
          border: 1px solid var(--bg-4);
          overflow: hidden;
          height: 160px;
          margin-top: var(--space-sm);
        }

        .canvas-badge {
          position: absolute;
          top: var(--space-sm);
          left: var(--space-sm);
          background: rgba(15, 17, 25, 0.7);
          border: 1px solid var(--bg-4);
          font-size: 9px;
          color: var(--t2);
          padding: 2px 8px;
          border-radius: var(--radius-badge);
          backdrop-filter: blur(4px);
        }

        .actions-row {
          display: flex;
          gap: var(--space-md);
          margin-top: var(--space-md);
        }
      `}</style>

      <div className="section-label">Modul Shader Background</div>

      {/* Mode Grid Selection */}
      <div className="shader-grid">
        {SHADER_MODES.map((modeName) => (
          <button
            key={modeName}
            className={`shader-option ${mode === modeName ? 'active' : ''}`}
            onClick={() => setMode(modeName)}
          >
            <span className="radio-dot"></span>
            <span>{modeName}</span>
          </button>
        ))}
      </div>

      {/* Sliders */}
      <div className="control-sliders">
        <div className="slider-group">
          <div className="slider-header">
            <span>Saturation</span>
            <span>{Math.floor(saturation * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            className="range-slider"
            value={saturation}
            onChange={(e) => setSaturation(parseFloat(e.target.value))}
          />
        </div>

        <div className="slider-group">
          <div className="slider-header">
            <span>Speed</span>
            <span>{Math.floor(speed * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.05"
            max="1"
            step="0.05"
            className="range-slider"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
          />
        </div>
      </div>

      {/* Preset Code & Copy URL */}
      <div className="preset-row">
        <div style={{ flex: 1 }}>
          <label className="login-form-label" style={{ fontSize: '10px' }}>Preset Code</label>
          <input type="text" className="input-field" style={{ height: '36px', fontSize: '11px', fontFamily: 'monospace' }} value={presetCode} readOnly />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button className="btn btn-secondary" style={{ height: '36px', padding: '0 var(--space-md)' }} onClick={handleCopyURL}>
            {copied ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
            <span style={{ fontSize: '12px' }}>{copied ? 'Copied!' : 'Copy URL'}</span>
          </button>
        </div>
      </div>

      {/* Shader Live Preview Canvas */}
      <div className="canvas-preview-container">
        <div className="canvas-badge">PREVIEW LIVE (LOCAL)</div>
        <canvas ref={canvasRef} />
      </div>

      {/* Actions */}
      <div className="actions-row">
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleActivate}>
          <Layers size={14} />
          <span>Aktifkan di Background ▶</span>
        </button>
        <button className="btn btn-clear" style={{ flex: 0.8 }} onClick={handleDeactivate}>
          <X size={14} />
          <span>Matikan ✕</span>
        </button>
      </div>
    </div>
  );
}
