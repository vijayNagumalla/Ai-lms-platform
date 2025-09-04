import React, { useState, useEffect } from 'react';

const Countdown = ({ targetDate, type = 'start' }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const formatNumber = (num) => num.toString().padStart(2, '0');

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">
        {type === 'start' ? 'Starts in:' : 'Ends in:'}
      </span>
      <div className="flex gap-1">
        {timeLeft.days > 0 && (
          <div className="bg-primary/10 text-primary px-2 py-1 rounded font-mono text-xs">
            {timeLeft.days}d
          </div>
        )}
        <div className="bg-primary/10 text-primary px-2 py-1 rounded font-mono text-xs">
          {formatNumber(timeLeft.hours)}h
        </div>
        <div className="bg-primary/10 text-primary px-2 py-1 rounded font-mono text-xs">
          {formatNumber(timeLeft.minutes)}m
        </div>
        <div className="bg-primary/10 text-primary px-2 py-1 rounded font-mono text-xs">
          {formatNumber(timeLeft.seconds)}s
        </div>
      </div>
    </div>
  );
};

export default Countdown; 