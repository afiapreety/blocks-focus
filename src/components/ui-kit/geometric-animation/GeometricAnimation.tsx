import { useEffect, useState } from 'react';
import { useTheme } from '@/styles/theme/theme-provider';

interface GeometricAnimationProps {
  className?: string;
}

export const GeometricAnimation = ({ className = '' }: GeometricAnimationProps) => {
  const { theme } = useTheme();
  const [animationPhase, setAnimationPhase] = useState(0);

  // Determine if dark mode based on theme
  const isDarkMode =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const numLayers = 26; // Fewer layers = more spacing between each
  const animationDelay = 150; // ms between each phase (slower)
  const visibleWindowSize = 14; // Smaller window = fewer layers visible at once

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase((prev) => (prev + 1) % (numLayers * 2));
    }, animationDelay);

    return () => clearInterval(interval);
  }, []);

  // Calculate opacity for each layer based on animation phase
  const getLayerOpacity = (layerIndex: number) => {
    const windowCenter = animationPhase % numLayers;
    
    let distance = Math.abs(layerIndex - windowCenter);
    
    if (distance > numLayers / 2) {
      distance = numLayers - distance;
    }
    
    if (distance <= visibleWindowSize / 2) {
      // Smoother, more gradual fade
      const normalizedDistance = distance / (visibleWindowSize / 2);
      const opacity = 1 - normalizedDistance * normalizedDistance * 0.85;
      return Math.max(0.1, opacity);
    }
    
    return 0.05; // Almost invisible for layers outside the window
  };

  // Generate the twisted triangle path
  const generateTwistedTrianglePath = (
    centerX: number,
    centerY: number,
    size: number,
    rotationDeg: number
  ) => {
    const corners = [
      { angle: -90 }, // Top
      { angle: 30 }, // Bottom right
      { angle: 150 }, // Bottom left
    ];

    const points = corners.map((corner) => {
      const angle = ((corner.angle + rotationDeg) * Math.PI) / 180;
      return {
        x: centerX + size * Math.cos(angle),
        y: centerY + size * Math.sin(angle),
      };
    });

    const path = `
      M ${(points[0].x + points[2].x) / 2} ${(points[0].y + points[2].y) / 2}
      Q ${points[0].x} ${points[0].y}, ${(points[0].x + points[1].x) / 2} ${(points[0].y + points[1].y) / 2}
      Q ${points[1].x} ${points[1].y}, ${(points[1].x + points[2].x) / 2} ${(points[1].y + points[2].y) / 2}
      Q ${points[2].x} ${points[2].y}, ${(points[0].x + points[2].x) / 2} ${(points[0].y + points[2].y) / 2}
      Z
    `;

    return path;
  };

  // Generate paths for a single pattern
  const generatePattern = (
    centerX: number,
    centerY: number,
    baseSize: number,
    patternId: string
  ) => {
    const paths = [];

    for (let i = 0; i < numLayers; i++) {
      const progress = i / numLayers;
      // More spacing between layers (smaller inner, larger steps)
      const size = baseSize * (0.06 + progress * 0.94);
      const rotation = i * 9; // Slightly more rotation per layer
      const opacity = getLayerOpacity(i);

      let strokeColor: string;
      if (isDarkMode) {
        const grayValue = Math.round(190 - progress * 90);
        strokeColor = `rgba(${grayValue}, ${grayValue}, ${grayValue}, ${opacity})`;
      } else {
        const r = Math.round(170 - progress * 133);
        const g = Math.round(200 - progress * 91);
        const b = Math.round(225 - progress * 63);
        strokeColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
      }

      paths.push(
        <path
          key={`${patternId}-${i}`}
          d={generateTwistedTrianglePath(centerX, centerY, size, rotation)}
          fill="none"
          stroke={strokeColor}
          strokeWidth={0.9}
          style={{
            transition: 'stroke 0.4s ease-out',
          }}
        />
      );
    }

    return paths;
  };

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{ backgroundColor: isDarkMode ? '#3f3f46' : '#e0f2fe' }}
    >
      <svg
        viewBox="0 0 400 900"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Top-right pattern - positioned to avoid middle overlap */}
        {generatePattern(360, 160, 320, 'top-right')}

        {/* Bottom-left pattern - positioned to avoid middle overlap */}
        {generatePattern(40, 740, 320, 'bottom-left')}
      </svg>
    </div>
  );
};

export default GeometricAnimation;
