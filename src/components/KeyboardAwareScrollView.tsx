import { Platform, ScrollView, type ScrollViewProps } from 'react-native';
import {
  KeyboardAwareScrollView as ControllerKeyboardAwareScrollView,
  type KeyboardAwareScrollViewProps,
} from 'react-native-keyboard-controller';
import { spacing } from '@/constants/theme';

/** Keeps the focused field (password, email, notes) above the keypad, like native apps. */
export function KeyboardAwareScrollView({
  keyboardShouldPersistTaps = 'handled',
  bottomOffset = spacing.xxl,
  ...rest
}: KeyboardAwareScrollViewProps) {
  if (Platform.OS === 'web') {
    return <ScrollView keyboardShouldPersistTaps={keyboardShouldPersistTaps} {...(rest as ScrollViewProps)} />;
  }

  return (
    <ControllerKeyboardAwareScrollView
      {...rest}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      bottomOffset={bottomOffset}
    />
  );
}
