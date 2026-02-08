import { useEffect, useState } from 'react';
import { useTheme } from '@/styles/theme/theme-provider';

/** Animation configuration constants */
const ANIMATION_CONFIG = {
  /** Total number of concentric triangle layers d:26 */
  numLayers: 26,
  /** Milliseconds between animation phase updates d:150 */
  animationDelay: 150,
  /** Number of layers visible at peak opacity d:14 */
  visibleWindowSize: 16,
  /** Rotation degrees per layer d:9 */
  rotationPerLayer: 6,
  /** Minimum size ratio for innermost layer d:0.06 */
  minSizeRatio: 0.16,
  /** Size growth ratio from inner to outer d:0.94 */
  sizeGrowthRatio: 1.2,
  /** Stroke width for triangle paths d:0.9 */
  strokeWidth: 0.9,
  /** Transition duration for stroke color changes d:0.4s */
  transitionDuration: '0.6s',
} as const;

interface GeometricAnimationProps {
  /** Additional CSS classes to apply to the container */
  className?: string;
}

export const GeometricAnimation = ({ className = '' }: GeometricAnimationProps) => {
  const { theme } = useTheme();
  const [animationPhase, setAnimationPhase] = useState(0);
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  // Listen for system theme changes when using system theme
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Determine if dark mode based on theme
  const isDarkMode = theme === 'dark' || (theme === 'system' && systemPrefersDark);

  const {
    numLayers,
    animationDelay,
    visibleWindowSize,
    rotationPerLayer,
    minSizeRatio,
    sizeGrowthRatio,
    strokeWidth,
    transitionDuration,
  } = ANIMATION_CONFIG;

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase((prev) => (prev + 1) % (numLayers * 2));
    }, animationDelay);

    return () => clearInterval(interval);
  }, [numLayers, animationDelay]);

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
      const size = baseSize * (minSizeRatio + progress * sizeGrowthRatio);
      const rotation = i * rotationPerLayer;
      const opacity = getLayerOpacity(i);

      let strokeColor: string;
      if (isDarkMode) {
        const grayValue = Math.round(190 - progress * 90);
        strokeColor = `rgba(${grayValue}, ${grayValue}, ${grayValue}, ${opacity})`;
      } else {
        // Brand-aligned colors: inner light tint → outer #0066B2
        const r = Math.round(180 - progress * 180);  // 180 → 0
        const g = Math.round(195 - progress * 93);   // 195 → 102
        const b = Math.round(230 - progress * 52);   // 230 → 178
        strokeColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
      }

      paths.push(
        <path
          key={`${patternId}-${i}`}
          d={generateTwistedTrianglePath(centerX, centerY, size, rotation)}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          style={{
            transition: `stroke ${transitionDuration} ease-out`,
          }}
        />
      );
    }

    return paths;
  };

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${isDarkMode ? 'bg-zinc-700' : 'bg-neutral-50'} ${className}`}
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
