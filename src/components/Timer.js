import React, { useState, useEffect } from 'react';

const Timer = ({ player, isActive, timeLeft, increment, onTimeExpired }) => {
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let intervalId;
    if (isActive && timeLeft > 0) {
      intervalId = setInterval(() => {
        if (timeLeft <= 1) {
          onTimeExpired(player);
        }
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [isActive, timeLeft, player, onTimeExpired]);

  return (
    <div className={`p-4 rounded-lg ${isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
      <div className="text-lg font-semibold mb-1">{player}</div>
      <div className={`text-2xl font-bold ${timeLeft < 30 ? 'text-red-600' : ''}`}>
        {formatTime(timeLeft)}
      </div>
      <div className="text-sm text-gray-500">+{increment}s/move</div>
    </div>
  );
};

export default Timer;