import { useWindowDimensions } from 'react-native';
import { useMemo } from 'react';
import { getDeviceCategory } from '../constants/responsive';

/**
 * Hook for accessing responsive device information
 * Returns device dimensions, category, and orientation info
 *
 * Example usage:
 * const { width, height, isSmallDevice, category } = useResponsive();
 */
export const useResponsive = () => {
  const { width, height } = useWindowDimensions();

  const deviceInfo = useMemo(() => {
    const category = getDeviceCategory(width);
    const isSmallDevice = height < 700;
    const isLandscape = width > height;

    return {
      width,
      height,
      category,
      isSmallDevice,
      isLandscape,
      isPortrait: !isLandscape,
      // Breakpoint checks for convenience
      isXSmall: category === 'xsmall',
      isSmall: category === 'small',
      isMedium: category === 'medium',
      isLarge: category === 'large',
    };
  }, [width, height]);

  return deviceInfo;
};

/**
 * Hook for accessing scaling factors
 * Returns scale, verticalScale, and device size info
 * Matches the pattern from OnboardingScreen.tsx:63-65
 *
 * Example usage:
 * const { scale, verticalScale, isSmallDevice } = useScaling();
 * const imageSize = isSmallDevice ? width * 0.5 : width * 0.6;
 */
export const useScaling = () => {
  const { width, height } = useWindowDimensions();

  const scaling = useMemo(() => {
    const baseWidth = 375;
    const baseHeight = 812;

    const scale = Math.min(width / baseWidth, 1.2);
    const verticalScale = Math.min(height / baseHeight, 1.1);
    const isSmallDevice = height < 700;

    return {
      scale,
      verticalScale,
      isSmallDevice,
      width,
      height,
    };
  }, [width, height]);

  return scaling;
};
