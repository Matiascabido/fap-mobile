import React from 'react';
import ExerciseVideoFeed from '../video/ExerciseVideoFeed';
import { VideoFeedItem } from '../../types/video.types';

interface VideoPlayerModalProps {
  visible: boolean;
  title?: string;
  embedUrl?: string | null;
  videoUrl?: string | null;
  videoId?: string | null;
  items?: VideoFeedItem[];
  initialIndex?: number;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
}

export default function VideoPlayerModal({
  visible,
  title,
  embedUrl,
  videoUrl,
  videoId,
  items,
  initialIndex = 0,
  onClose,
  onIndexChange,
}: VideoPlayerModalProps) {
  const feedItems: VideoFeedItem[] =
    items && items.length > 0
      ? items
      : [
          {
            id: videoId || videoUrl || embedUrl || 'single',
            titulo: title || 'Video',
            embedUrl: embedUrl ?? undefined,
            videoUrl: videoUrl ?? undefined,
            videoId: videoId ?? undefined,
          },
        ];

  return (
    <ExerciseVideoFeed
      visible={visible}
      items={feedItems}
      initialIndex={initialIndex}
      onClose={onClose}
      onIndexChange={onIndexChange}
    />
  );
}
