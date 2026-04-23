import React from 'react';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Logo({ className, size = 'md' }: LogoProps) {
  const sizes = {
    sm: 'h-6',
    md: 'h-10',
    lg: 'h-16',
    xl: 'h-24'
  };

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className={cn("relative flex items-center justify-center overflow-hidden rounded-xl", sizes[size])}>
        {/* Placeholder: El usuario debe subir su logo como public/logo.png */}
        <img 
          src="/logo.png" 
          alt="LDIPHONE Logo" 
          className="h-full w-auto object-contain fallback-image"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent && !parent.querySelector('.logo-fallback')) {
              const fallback = document.createElement('div');
              fallback.className = 'logo-fallback flex flex-col items-center justify-center leading-none font-black text-slate-900 uppercase tracking-tighter';
              fallback.innerHTML = `
                <div class="bg-slate-900 text-white rounded-lg p-1.5 flex flex-col items-center min-w-[40px]">
                  <span class="text-[10px] leading-none mb-0.5">LD</span>
                  <span class="text-[7px] text-rose-500 font-bold leading-none">iPhone</span>
                </div>
              `;
              parent.appendChild(fallback);
            }
          }}
        />
      </div>
    </div>
  );
}
