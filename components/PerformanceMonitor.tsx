"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface PerformanceMetrics {
  navigationStart: number;
  navigationEnd: number;
  navigationDuration: number;
  pathname: string;
  timestamp: string;
}

export const PerformanceMonitor = () => {
  const pathname = usePathname();
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const navigationStart = performance.now();
    
    // Simulate navigation completion
    const handleNavigationComplete = () => {
      const navigationEnd = performance.now();
      const navigationDuration = navigationEnd - navigationStart;
      
      const newMetric: PerformanceMetrics = {
        navigationStart,
        navigationEnd,
        navigationDuration,
        pathname,
        timestamp: new Date().toISOString(),
      };
      
      setMetrics(prev => [...prev.slice(-4), newMetric]); // Keep last 5 metrics
    };

    // Use requestAnimationFrame to measure after render
    requestAnimationFrame(() => {
      requestAnimationFrame(handleNavigationComplete);
    });
  }, [pathname]);

  // Toggle visibility with Ctrl+Shift+P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isVisible) return null;

  const averageDuration = metrics.length > 0 
    ? metrics.reduce((sum, m) => sum + m.navigationDuration, 0) / metrics.length 
    : 0;

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
      <h3 className="font-bold mb-2">Performance Monitor</h3>
      <div className="text-sm space-y-1">
        <div>Current: {pathname}</div>
        <div>Avg Navigation: {averageDuration.toFixed(2)}ms</div>
        <div>Last 5 navigations:</div>
        {metrics.slice().reverse().map((metric, index) => (
          <div key={index} className="text-xs opacity-75">
            {metric.pathname}: {metric.navigationDuration.toFixed(2)}ms
          </div>
        ))}
      </div>
      <div className="text-xs opacity-50 mt-2">
        Press Ctrl+Shift+P to toggle
      </div>
    </div>
  );
}; 