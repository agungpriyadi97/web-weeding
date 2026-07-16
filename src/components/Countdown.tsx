'use client';

import React, { useEffect, useState } from 'react';

interface CountdownProps {
  targetDate: string;
}

export default function Countdown({ targetDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      // Handle potential formats or empty inputs gracefully
      if (!targetDate) return;
      
      const targetTime = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference <= 0) {
        setIsExpired(true);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (!targetDate) return null;

  if (isExpired) {
    return (
      <div className="text-lg sm:text-xl font-serif text-gold-600 tracking-wide text-center py-4 font-semibold">
        Hari Bahagia Telah Tiba! ✨
      </div>
    );
  }

  const items = [
    { label: 'Hari', value: timeLeft.days },
    { label: 'Jam', value: timeLeft.hours },
    { label: 'Menit', value: timeLeft.minutes },
    { label: 'Detik', value: timeLeft.seconds },
  ];

  return (
    <div className="grid grid-cols-4 gap-3 max-w-md mx-auto py-4">
      {items.map((item, index) => (
        <div 
          key={index} 
          className="flex flex-col items-center justify-center p-3 rounded-xl glass-card shadow-sm border border-gold-100"
        >
          <span className="text-2xl sm:text-3xl font-serif font-bold text-gold-600 leading-none">
            {String(item.value).padStart(2, '0')}
          </span>
          <span className="text-[10px] sm:text-xs text-gold-800/80 font-medium tracking-wide uppercase mt-1.5">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
