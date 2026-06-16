import React, { createContext, useContext, useState, ReactNode } from 'react';

interface VideoFeedContextType {
  isVideoFeedOpen: boolean;
  setVideoFeedOpen: (open: boolean) => void;
}

const VideoFeedContext = createContext<VideoFeedContextType | undefined>(undefined);

export function VideoFeedProvider({ children }: { children: ReactNode }) {
  const [isVideoFeedOpen, setVideoFeedOpen] = useState(false);
  return (
    <VideoFeedContext.Provider value={{ isVideoFeedOpen, setVideoFeedOpen }}>
      {children}
    </VideoFeedContext.Provider>
  );
}

export function useVideoFeed() {
  const ctx = useContext(VideoFeedContext);
  if (!ctx) throw new Error('useVideoFeed must be used within VideoFeedProvider');
  return ctx;
}
