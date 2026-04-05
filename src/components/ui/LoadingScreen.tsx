import React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full animate-in fade-in duration-700">
      <div className="relative w-20 h-20">
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-full border-2 border-[#FFB800]/20 animate-ping"></div>
        {/* Inner spinning ring */}
        <div className="absolute inset-0 rounded-full border-t-2 border-[#FFB800] animate-spin"></div>
        {/* Center mark */}
        <div className="absolute inset-4 rounded-full bg-[#FFB800]/10 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-[#FFB800] animate-pulse"></div>
        </div>
      </div>
      <p className="mt-8 text-xs font-black text-text-tertiary uppercase tracking-[0.3em] animate-pulse">
        Carregando Experiência...
      </p>
    </div>
  );
};
