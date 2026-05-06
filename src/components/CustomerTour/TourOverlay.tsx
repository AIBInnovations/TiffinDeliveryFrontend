import React, { useMemo } from 'react';
import {
  Dimensions,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { TourStep, TourTargetRect } from './types';

interface Props {
  step: TourStep;
  target: TourTargetRect | null;
  isLast: boolean;
  onNext: () => void;
  onSkip: () => void;
}

const SCREEN = Dimensions.get('window');
const DIM_COLOR = 'rgba(15, 23, 42, 0.78)';
const RING_PADDING = 8;
const TOOLTIP_WIDTH = Math.min(SCREEN.width - 32, 340);
const TOOLTIP_GAP = 12;

const TourOverlay: React.FC<Props> = ({ step, target, isLast, onNext, onSkip }) => {
  // Decide whether tooltip sits above or below the target. If the target is in
  // the bottom half of the screen we float the tooltip above it, otherwise below.
  // For step.placement explicitly set, honor it.
  const layout = useMemo(() => {
    if (!target) {
      return { mode: 'center' as const };
    }
    const ringTop = target.y - RING_PADDING;
    const ringLeft = target.x - RING_PADDING;
    const ringWidth = target.width + RING_PADDING * 2;
    const ringHeight = target.height + RING_PADDING * 2;

    const targetCenterY = target.y + target.height / 2;
    const placeAbove =
      step.placement === 'above' ||
      (step.placement !== 'below' && targetCenterY > SCREEN.height * 0.55);

    return {
      mode: 'spotlight' as const,
      ringTop,
      ringLeft,
      ringWidth,
      ringHeight,
      tooltipTop: placeAbove
        ? Math.max(40, ringTop - TOOLTIP_GAP - 200)
        : ringTop + ringHeight + TOOLTIP_GAP,
      tooltipLeft: Math.max(
        16,
        Math.min(SCREEN.width - TOOLTIP_WIDTH - 16, target.x + target.width / 2 - TOOLTIP_WIDTH / 2),
      ),
    };
  }, [target, step.placement]);

  return (
    <Modal
      transparent
      animationType="fade"
      visible
      statusBarTranslucent
      onRequestClose={onSkip}
    >
      {layout.mode === 'spotlight' ? (
        <>
          <View style={[styles.dimPanel, { top: 0, left: 0, right: 0, height: Math.max(0, layout.ringTop) }]} />
          <View
            style={[
              styles.dimPanel,
              {
                top: layout.ringTop + layout.ringHeight,
                left: 0,
                right: 0,
                bottom: 0,
              },
            ]}
          />
          <View
            style={[
              styles.dimPanel,
              {
                top: layout.ringTop,
                left: 0,
                width: Math.max(0, layout.ringLeft),
                height: layout.ringHeight,
              },
            ]}
          />
          <View
            style={[
              styles.dimPanel,
              {
                top: layout.ringTop,
                left: layout.ringLeft + layout.ringWidth,
                right: 0,
                height: layout.ringHeight,
              },
            ]}
          />
        </>
      ) : (
        <View style={styles.dim} pointerEvents="auto" />
      )}

      {layout.mode === 'spotlight' && (
        <View
          pointerEvents="none"
          style={[
            styles.ring,
            {
              top: layout.ringTop,
              left: layout.ringLeft,
              width: layout.ringWidth,
              height: layout.ringHeight,
            },
          ]}
        />
      )}

      <View
        style={[
          styles.tooltip,
          layout.mode === 'spotlight'
            ? { position: 'absolute', top: layout.tooltipTop, left: layout.tooltipLeft, width: TOOLTIP_WIDTH }
            : styles.tooltipCenter,
        ]}
      >
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.body}>{step.body}</Text>

        <View style={styles.actions}>
          <TouchableOpacity onPress={onSkip} style={styles.skipButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onNext} style={styles.nextButton} activeOpacity={0.85}>
            <Text style={styles.nextText}>{isLast ? 'Got it' : 'Next'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: DIM_COLOR,
  },
  dimPanel: {
    position: 'absolute',
    backgroundColor: DIM_COLOR,
  },
  ring: {
    position: 'absolute',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#FE8733',
    backgroundColor: 'rgba(254, 135, 51, 0.08)',
  },
  tooltip: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 12 },
    }),
  },
  tooltipCenter: {
    position: 'absolute',
    left: (SCREEN.width - TOOLTIP_WIDTH) / 2,
    top: SCREEN.height / 2 - 100,
    width: TOOLTIP_WIDTH,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  body: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  skipButton: { paddingVertical: 6, paddingHorizontal: 4 },
  skipText: { color: '#64748B', fontSize: 14, fontWeight: '500' },
  nextButton: {
    backgroundColor: '#FE8733',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 22,
  },
  nextText: { color: 'white', fontSize: 14, fontWeight: '700' },
});

export default TourOverlay;
