import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { typography } from '../../theme/iosTheme';

interface GroupedSectionProps {
  title?: string;
  footer?: string;
  children: ReactNode;
  style?: ViewStyle;
}

export default function GroupedSection({ title, footer, children, style }: GroupedSectionProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.wrapper, style]}>
      {title ? (
        <Text style={[styles.header, typography.sectionHeader, { color: colors.secondaryLabel }]}>
          {title}
        </Text>
      ) : null}
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.secondaryGroupedBackground,
            borderColor: colors.separator,
          },
        ]}
      >
        {children}
      </View>
      {footer ? (
        <Text style={[styles.footer, { color: colors.secondaryLabel }]}>{footer}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 24,
  },
  header: {
    marginBottom: 6,
    marginLeft: 16,
  },
  container: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  footer: {
    fontSize: 13,
    marginTop: 6,
    marginHorizontal: 16,
    lineHeight: 18,
  },
});
