import { useCallback, useEffect, useRef } from 'react';
import { useCustomerTour } from './CustomerTourProvider';
import { TourStepId } from './types';

/**
 * Attach to any View whose layout should drive the tour spotlight for `id`.
 *
 * Usage:
 *   const { ref, onLayout } = useTourTarget('location');
 *   return <View ref={ref} onLayout={onLayout}>...</View>;
 */
export const useTourTarget = (id: TourStepId | null) => {
  const { active, currentStep, registerTarget } = useCustomerTour();
  const ref = useRef<any>(null);

  const measure = useCallback(() => {
    if (!id || !ref.current) return;
    ref.current.measureInWindow((x: number, y: number, width: number, height: number) => {
      if (width > 0 && height > 0) {
        registerTarget(id, { x, y, width, height });
      }
    });
  }, [id, registerTarget]);

  // Re-measure when this step becomes active so layout-shifted targets stay accurate.
  useEffect(() => {
    if (id && active && currentStep?.id === id) {
      // Slight delay so any pre-step layout settle (keyboard close, scroll snap) completes.
      const t = setTimeout(measure, 120);
      return () => clearTimeout(t);
    }
  }, [active, currentStep?.id, id, measure]);

  // Unregister on unmount to avoid pointing the spotlight at a stale rect.
  useEffect(() => {
    if (!id) return;
    return () => registerTarget(id, null);
  }, [id, registerTarget]);

  return { ref, onLayout: measure };
};
