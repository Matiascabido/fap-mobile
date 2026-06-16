import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { palette } from '../../constants/colors';
import { VideoFeedItem } from '../../types/video.types';
import { hapticSelection } from '../../utils/haptics';

interface TutorialVideoCardProps {
  item: VideoFeedItem;
  onPress: () => void;
}

function TutorialVideoCard({ item, onPress }: TutorialVideoCardProps) {
  const { isDark, colors } = useAppTheme();
  const cardBg = isDark ? palette.darkCard : '#FFFFFF';
  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;
  const borderColor = isDark ? palette.darkBorder : palette.lightBorder;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: cardBg, borderColor }]}
      onPress={() => {
        hapticSelection();
        onPress();
      }}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Reproducir ${item.titulo}`}
    >
      <View style={styles.thumbnailContainer}>
        {item.thumbnail ? (
          <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} resizeMode="cover" />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
            <MaterialCommunityIcons name="video-off" size={32} color={palette.slate400} />
          </View>
        )}
        <View style={styles.playOverlay}>
          <View style={styles.playButton}>
            <MaterialCommunityIcons name="play" size={28} color="#FFFFFF" />
          </View>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={[styles.cardTitle, { color: textPrimary }]} numberOfLines={2}>
          {item.titulo}
        </Text>
        {item.instructor ? (
          <View style={styles.cardMeta}>
            <MaterialCommunityIcons name="account-tie" size={14} color={textSecondary} />
            <Text style={[styles.cardInstructor, { color: textSecondary }]} numberOfLines={1}>
              {item.instructor}
            </Text>
          </View>
        ) : null}
        {item.subtitle ? (
          <View style={[styles.subtitlePill, { backgroundColor: `${colors.tint}14` }]}>
            <Text style={[styles.subtitleText, { color: colors.tint }]} numberOfLines={1}>
              {item.subtitle}
            </Text>
          </View>
        ) : null}
        <Text style={[styles.hint, { color: textSecondary }]}>Tocá para ver en YouTube</Text>
      </View>
    </TouchableOpacity>
  );
}

export default memo(TutorialVideoCard);

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginHorizontal: 12,
    marginBottom: 12,
  },
  thumbnailContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    backgroundColor: 'rgba(100,116,139,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(220,38,38,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 4,
  },
  cardBody: {
    padding: 14,
    gap: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardInstructor: {
    fontSize: 13,
    flex: 1,
  },
  subtitlePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  subtitleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  hint: {
    fontSize: 12,
    marginTop: 2,
  },
});
