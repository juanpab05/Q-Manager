"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import supabase from "../../utils/supabaseClient"; // Assuming supabaseClient is in src/utils
import {
  getActiveAnnouncements,
  Announcement,
} from "../../api/announcementService"; // Adjust path as needed
import { motion, AnimatePresence } from "framer-motion";

// Helper to construct Supabase Storage public URL
const getMediaUrl = (path: string): string => {
  if (!path) return "";
  const { data } = supabase.storage
    .from("announcements-media") // Bucket name from announcementService.js
    .getPublicUrl(path);
  return data?.publicUrl || "";
};

// SVG Icons
const VolumeUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
  </svg>
);

const VolumeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
  </svg>
);

const AnnouncementsCarousel: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const isAdvancingRef = useRef(false);

  const fetchAnnouncements = useCallback(async () => {
    try {
      setIsLoading(true);
      const activeAnnouncements = await getActiveAnnouncements();
      const validAnnouncements = activeAnnouncements.filter(
        (ann) => ann.media_file && ann.media_type
      );
      setAnnouncements(validAnnouncements);
      setCurrentIndex(0);
    } catch (error) {
      setAnnouncements([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
    const channel = supabase
      .channel("announcements-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        () => {
          fetchAnnouncements();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [fetchAnnouncements]);

  const advanceSlide = useCallback(() => {
    setCurrentIndex((prevIndex) =>
      announcements.length > 0 ? (prevIndex + 1) % announcements.length : 0
    );
  }, [announcements.length]);
  
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  useEffect(() => {
    // Reset advancing flag when we start processing a new announcement
    isAdvancingRef.current = false;
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (announcements.length === 0 || !announcements[currentIndex]) {
      return;
    }

    const currentAnnouncement = announcements[currentIndex];
    const mediaType = currentAnnouncement.media_type || "";

    const handleVideoEndOrTimeout = () => {
      // Prevent multiple calls
      if (isAdvancingRef.current) {
        return;
      }
      
      isAdvancingRef.current = true;
      
      // Cleanup to prevent multiple calls
      if (videoRef.current) {
        videoRef.current.onended = null;
        videoRef.current.onloadedmetadata = null;
        videoRef.current.onerror = null;
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null; 
      }
      
      // Add a small delay to ensure state updates properly
      setTimeout(() => {
        advanceSlide();
        isAdvancingRef.current = false;
      }, 100);
    };

    if (mediaType.startsWith("image/")) {
      timerRef.current = setTimeout(advanceSlide, 10000); // 10 seconds for images
    } else if (mediaType.startsWith("video/")) {
      const videoElement = videoRef.current;
      if (videoElement) {
        videoElement.onended = () => {
          handleVideoEndOrTimeout();
        };
        videoElement.onerror = () => {
          handleVideoEndOrTimeout(); // Skip to next announcement on error
        };
        
        const handleMetadataLoaded = () => {
          videoElement.muted = isMuted; // Apply mute state on load
          const duration = videoElement.duration;
          
          if (duration && duration > 0 && isFinite(duration)) {
            if (duration > 60) { // Max 60 seconds for videos
              if (timerRef.current) clearTimeout(timerRef.current);
              timerRef.current = setTimeout(handleVideoEndOrTimeout, 60000);
            } else {
              // For videos <= 60s, set a safety timeout slightly longer than duration
              const safetyTimeout = (duration + 2) * 1000; // Add 2 seconds buffer
              if (timerRef.current) clearTimeout(timerRef.current);
              timerRef.current = setTimeout(() => {
                handleVideoEndOrTimeout();
              }, safetyTimeout);
            }
          } else { // Fallback for videos with no or invalid duration
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(handleVideoEndOrTimeout, 10000);
          }
        };
        
        videoElement.onloadedmetadata = handleMetadataLoaded;
        
        // If metadata already loaded (e.g. cached video)
        if (videoElement.readyState >= videoElement.HAVE_METADATA) {
          handleMetadataLoaded();
        }

      } else { // Fallback if videoRef is not available
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(handleVideoEndOrTimeout, 10000);
      }
    } else { // Fallback for unknown media types
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(advanceSlide, 10000);
    }

    return () => { // Cleanup
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      const videoElement = videoRef.current;
      if (videoElement) {
        videoElement.onloadedmetadata = null;
        videoElement.onended = null;
        videoElement.onerror = null;
      }
    };
  }, [currentIndex, announcements, advanceSlide, isMuted]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64 text-white">Loading announcements...</div>;
  }

  if (announcements.length === 0) {
    return <div className="flex justify-center items-center h-64 text-white">No active announcements.</div>;
  }

  const currentAnnouncement = announcements[currentIndex];
  const mediaUrl = currentAnnouncement.media_file
    ? getMediaUrl(currentAnnouncement.media_file as string)
    : "";
  const mediaType = currentAnnouncement.media_type || "";

  const variants = {
    enter: { opacity: 0, scale: 0.95 },
    center: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 },
  };

  return (
    <div 
      className="relative w-full max-w-3xl mx-auto aspect-video overflow-hidden rounded-lg shadow-lg bg-gray-900"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={currentIndex}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ opacity: { duration: 0.5 }, scale: { duration: 0.5 } }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {mediaUrl && mediaType.startsWith("image/") && (
            <img
              src={mediaUrl}
              alt={`Announcement ${currentAnnouncement.id}`}
              className="w-full h-full object-contain"
            />
          )}
          {mediaUrl && mediaType.startsWith("video/") && (
            <video
              ref={videoRef}
              src={mediaUrl}
              className="w-full h-full object-contain"
              autoPlay
              playsInline
              muted={isMuted} // Controlled by state
              loop={false} // Ensure loop is false, advanceSlide handles repeating
              onContextMenu={(e) => e.preventDefault()} // Optional: disable right-click
            />
          )}
          {!mediaType.startsWith("image/") && !mediaType.startsWith("video/") && mediaUrl && (
             <p className="text-white">Unsupported media type or error loading media.</p>
          )}
           {!mediaUrl && (
             <p className="text-white">Media not available for this announcement.</p>
          )}
        </motion.div>
      </AnimatePresence>
      
      {isHovering && mediaType.startsWith("video/") && announcements.length > 0 && (
        <button 
          onClick={toggleMute} 
          className="absolute bottom-3 right-3 p-2 bg-black bg-opacity-60 rounded-full text-white hover:bg-opacity-80 transition-opacity duration-200 z-20"
          aria-label={isMuted ? "Unmute video" : "Mute video"}
        >
          {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
        </button>
      )}
    </div>
  );
};

export default AnnouncementsCarousel; 