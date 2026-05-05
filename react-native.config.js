module.exports = {
  assets: ['./src/assets/fonts'],
  dependencies: {
    // react-native-maps@1.26.0 + RN 0.82 new architecture: Fabric component
    // descriptors (RNMapsGooglePolygonProps etc.) crash std::terminate() during
    // ReactInstance native registration in release builds. Disabling autolinking
    // is the only path that ships today — every workaround hits an ecosystem block:
    //   - newArchEnabled=false → react-native-reanimated@4 prefab fails
    //   - hermesEnabled=false → react-native-worklets can't link to JSC target
    //   - C++ Debug build type → reanimated prefab consumer can't read RelWithDebInfo
    // Restore in a follow-up release once we can either:
    //   - Upgrade to react-native-maps@2.x (Fabric-stable)
    //   - Replace LocationPicker with a GPS + Google Geocoding HTTP flow
    'react-native-maps': {
      platforms: {
        android: null,
        ios: null,
      },
    },
  },
};
