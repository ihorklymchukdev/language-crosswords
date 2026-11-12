import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Modal, Platform, Pressable, StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
  closeLabel: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

const useNativeDriver = Platform.OS !== 'web';

// Modal's own "slide" moves the backdrop too, so the Modal itself doesn't animate:
// the backdrop fades and only the sheet slides. It stays mounted until the close animation ends.
export function BottomSheet({ visible, onClose, closeLabel, style, children }: Props) {
  const progress = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);
  const { height: windowHeight } = useWindowDimensions();
  const [sheetHeight, setSheetHeight] = useState<number | null>(null);

  useEffect(() => {
    if (visible) setMounted(true);
    const animation = Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? 280 : 220,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver,
    });
    animation.start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
    return () => animation.stop();
  }, [visible, progress]);

  // Until the sheet is measured, start it a full window below so it never flashes in place.
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [sheetHeight ?? windowHeight, 0] });

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: progress }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={closeLabel} />
        </Animated.View>
        <Animated.View style={[style, { transform: [{ translateY }] }]} onLayout={(e) => setSheetHeight(e.nativeEvent.layout.height)}>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(16,19,25,0.4)' },
});
