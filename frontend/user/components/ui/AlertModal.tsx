import { BlurView } from 'expo-blur';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Fonts, Radius } from '../../constants/theme';

export interface AlertAction {
  label: string;
  onPress: () => void;
  style?: 'default' | 'cancel' | 'destructive' | 'primary';
}

interface Props {
  visible: boolean;
  title: string;
  message?: string;
  actions: AlertAction[];
  onDismiss?: () => void;
}

export function AlertModal({ visible, title, message, actions, onDismiss }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <View style={styles.card}>
          <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.border} />
          <View style={styles.inner}>
            <Text style={styles.title}>{title}</Text>
            {message ? <Text style={styles.message}>{message}</Text> : null}
            <View style={[styles.actions, actions.length === 2 && styles.actionsRow]}>
              {actions.map(action => (
                <TouchableOpacity
                  key={action.label}
                  style={[styles.btn, btnStyle[action.style ?? 'default']]}
                  onPress={action.onPress}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.btnText, btnTextStyle[action.style ?? 'default']]}>
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const btnStyle: Record<string, object> = {
  default:     { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  cancel:      { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  destructive: { backgroundColor: 'rgba(224,112,112,0.18)', borderWidth: 1, borderColor: 'rgba(224,112,112,0.4)' },
  primary:     { backgroundColor: Colors.mint },
};

const btnTextStyle: Record<string, object> = {
  default:     { color: Colors.ink700 },
  cancel:      { color: Colors.ink500 },
  destructive: { color: '#E07070' },
  primary:     { color: '#000' },
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: 'rgba(18,18,18,0.82)',
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  inner: { padding: 24 },
  title: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: Colors.ink900,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.ink500,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 4,
  },
  actions: { marginTop: 20, gap: 10 },
  actionsRow: { flexDirection: 'row-reverse' },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  btnText: {
    fontFamily: Fonts.displayMedium,
    fontSize: 15,
  },
});
