'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Music, Volume2, VolumeX } from 'lucide-react';

interface MusicPlayerProps {
  play: boolean;
  audioUrl?: string;
}

export default function MusicPlayer({ play, audioUrl }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // Use a fallback public piano/wedding audio URL if not provided
  const targetAudioUrl = audioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3';

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(targetAudioUrl);
    audio.loop = true;
    audio.muted = isMuted;
    audioRef.current = audio;

    if (play) {
      audio.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(err => {
          console.warn('Play attempt blocked or failed:', err.message);
          setIsPlaying(false);
        });
    }

    return () => {
      audio.pause();
      if (audioRef.current === audio) {
        audioRef.current = null;
      }
    };
  }, [targetAudioUrl, play, isMuted]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch(err => {
            console.error('Manual play failed:', err);
          });
      }
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Do not show the controller unless the invitation has been opened/played
  if (!play) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-center">
      {/* Play/Pause disc button */}
      <button
        onClick={togglePlay}
        className={`w-12 h-12 rounded-full glass-card border border-gold-300 shadow-xl flex items-center justify-center text-gold-600 transition-all duration-300 hover:scale-110 cursor-pointer ${
          isPlaying ? 'animate-spin-slow bg-gold-50 ring-2 ring-gold-200' : 'bg-white'
        }`}
        title={isPlaying ? 'Pause Musik' : 'Play Musik'}
      >
        <Music className="w-5 h-5" />
      </button>

      {/* Mute button */}
      <button
        onClick={toggleMute}
        className="w-8 h-8 rounded-full glass-card border border-gold-200 shadow-md flex items-center justify-center text-gold-500 hover:bg-gold-50 transition-all cursor-pointer"
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
    </div>
  );
}
