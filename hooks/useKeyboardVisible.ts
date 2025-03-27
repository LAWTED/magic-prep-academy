"use client";

import { useState, useEffect } from "react";

/**
 * Custom hook to detect if the mobile keyboard is visible
 * @param {number} threshold - Percentage of screen height reduction to consider keyboard visible (0-1)
 * @returns {boolean} - Whether the keyboard is currently visible
 */
export function useKeyboardVisible(threshold = 0.75): boolean {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    // Skip for SSR
    if (typeof window === "undefined") return;

    // Get initial viewport height
    const initialViewportHeight = window.visualViewport?.height || window.innerHeight;

    const handleResize = () => {
      const currentViewportHeight = window.visualViewport?.height || window.innerHeight;
      // If viewport height is significantly reduced, keyboard is likely visible
      const keyboardThreshold = initialViewportHeight * threshold;
      setIsKeyboardVisible(currentViewportHeight < keyboardThreshold);
    };

    // Listen for viewport changes (which happen when keyboard opens)
    window.visualViewport?.addEventListener('resize', handleResize);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, [threshold]);

  return isKeyboardVisible;
}