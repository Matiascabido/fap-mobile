import React, { ReactNode } from 'react';
import {
  Pressable,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { typography } from '../../theme/iosTheme';
import { hapticSelection } from '../../utils/haptics';

interface ListRowProps {
  title: string;
  subtitle?: string;
  detail?: string;
  onPress?: () => void;
  showChevron?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  isLast?: boolean;
  rightElement?: ReactNode;
  style?: ViewStyle;
}

export default function ListRow({
  title,
  subtitle,
  detail,
  onPress,
  showChevron = Boolean(onPress),
  icon,
  isLast = false,
  rightElement,
  style,
}: ListRowProps) {
  const { colors } = useAppTheme();

  const content = (
    <>
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: `${colors.tint}18` }]}>
          <Ionicons name={icon} size={18} color={colors.tint} />
        </View>
      ) : null}
      <View style={styles.textWrap}>
        <Text style={[styles.title, typography.body, { color: colors.label }]} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.secondaryLabel }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {detail ? (
        <Text style={[styles.detail, { color: colors.secondaryLabel }]} numberOfLines={1}>
          {detail}
        </Text>
      ) : null}
      {rightElement}
      {showChevron && onPress ? (
        <Ionicons name="chevron-forward" size={18} color={colors.tertiaryLabel} />
      ) : null}
    </>
  );

  const rowStyle = [
    styles.row,
    !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={() => {
          hapticSelection();
          onPress();
        }}
        style={({ pressed }) => [
          ...rowStyle,
          pressed && Platform.OS === 'ios' && { opacity: 0.65 },
        ]}
        accessibilityRole="button"
      >
        {content}
      </Pressable>
    );
  }

  return <View style={rowStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
    gap: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 17,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 2,
  },
  detail: {
    fontSize: 17,
    maxWidth: '35%',
  },
});
