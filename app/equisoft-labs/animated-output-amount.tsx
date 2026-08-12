"use client";

import { useEffect, useRef, useState } from "react";

type AnimatedOutputAmountProps = {
  className: string;
  value: number;
};

export function AnimatedOutputAmount({
  className,
  value,
}: AnimatedOutputAmountProps) {
  const amountRef = useRef<HTMLSpanElement>(null);
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    const element = amountRef.current;

    if (!element) {
      return;
    }

    let frame = 0;
    let hasStarted = false;
    let startTime = 0;
    const duration = 1500;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const animate = (timestamp: number) => {
      if (!startTime) {
        startTime = timestamp;
      }

      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAmount(Math.round(value * eased));

      if (progress < 1) {
        frame = window.requestAnimationFrame(animate);
      }
    };

    const start = () => {
      if (hasStarted) {
        return;
      }

      hasStarted = true;

      if (prefersReducedMotion) {
        setAmount(value);
        return;
      }

      frame = window.requestAnimationFrame(animate);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          start();
          observer.disconnect();
        }
      },
      { threshold: 0.45 },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [value]);

  return (
    <span ref={amountRef} className={className}>
      ${amount.toLocaleString("en-US")}
    </span>
  );
}
