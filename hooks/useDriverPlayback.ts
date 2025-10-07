import { useState, useEffect, useRef, useCallback } from 'react';

export interface PlaybackLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface UseDriverPlaybackParams {
  driverId: string | null;
  locations: PlaybackLocation[];
  speed?: number;
  autoPlay?: boolean;
}

export interface UseDriverPlaybackReturn {
  play: () => void;
  pause: () => void;
  restart: () => void;
  setSpeed: (speed: number) => void;
  isPlaying: boolean;
  currentIndex: number;
  progress: number;
  currentLocation: PlaybackLocation | null;
}

export function useDriverPlayback({
  driverId,
  locations,
  speed = 1,
  autoPlay = false,
}: UseDriverPlaybackParams): UseDriverPlaybackReturn {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(speed);
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const progress = locations.length > 0 ? (currentIndex / (locations.length - 1)) * 100 : 0;
  const currentLocation = locations[currentIndex] || null;

  const play = useCallback(() => {
    console.log('[useDriverPlayback] Play');
    setIsPlaying(true);
    startTimeRef.current = Date.now();
  }, []);

  const pause = useCallback(() => {
    console.log('[useDriverPlayback] Pause');
    setIsPlaying(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const restart = useCallback(() => {
    console.log('[useDriverPlayback] Restart');
    setCurrentIndex(0);
    setIsPlaying(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const setSpeed = useCallback((newSpeed: number) => {
    console.log('[useDriverPlayback] Set speed:', newSpeed);
    setPlaybackSpeed(newSpeed);
  }, []);

  const animate = useCallback(() => {
    if (!isPlaying || locations.length === 0) {
      return;
    }

    const now = Date.now();
    const deltaTime = now - lastUpdateTimeRef.current;

    if (deltaTime < 16) {
      animationFrameRef.current = requestAnimationFrame(animate);
      return;
    }

    lastUpdateTimeRef.current = now;

    setCurrentIndex((prevIndex) => {
      if (prevIndex >= locations.length - 1) {
        setIsPlaying(false);
        console.log('[useDriverPlayback] Playback completed');
        return prevIndex;
      }

      const baseIncrement = 0.5;
      const increment = baseIncrement * playbackSpeed;
      const nextIndex = Math.min(
        Math.floor(prevIndex + increment),
        locations.length - 1
      );

      return nextIndex;
    });

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [isPlaying, locations.length, playbackSpeed]);

  useEffect(() => {
    if (isPlaying && locations.length > 0) {
      lastUpdateTimeRef.current = Date.now();
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying, animate, locations.length]);

  useEffect(() => {
    if (currentLocation && driverId) {
      console.log(`[useDriverPlayback] Driver ${driverId} at index ${currentIndex}:`, {
        lat: currentLocation.latitude.toFixed(4),
        lng: currentLocation.longitude.toFixed(4),
        progress: `${progress.toFixed(1)}%`,
      });
    }
  }, [currentIndex, currentLocation, driverId, progress]);

  useEffect(() => {
    setCurrentIndex(0);
    setIsPlaying(autoPlay);
  }, [driverId, autoPlay]);

  return {
    play,
    pause,
    restart,
    setSpeed,
    isPlaying,
    currentIndex,
    progress,
    currentLocation,
  };
}
