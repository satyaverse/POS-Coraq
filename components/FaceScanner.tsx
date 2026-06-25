import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { Camera, RefreshCw, XCircle } from 'lucide-react';

interface FaceScannerProps {
  onFaceDetected: (descriptor: number[]) => void;
  onCancel: () => void;
  title?: string;
}

export const FaceScanner: React.FC<FaceScannerProps> = ({ onFaceDetected, onCancel, title = "Scan Wajah" }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Load models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        setIsModelLoaded(true);
      } catch (error) {
        console.error("Error loading face models:", error);
        setErrorMsg("Gagal memuat model AI. Pastikan ada koneksi internet.");
      }
    };
    loadModels();
  }, []);

  // Start video
  useEffect(() => {
    let stream: MediaStream | null = null;
    
    const startVideo = async () => {
      if (isModelLoaded && videoRef.current) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
          videoRef.current.srcObject = stream;
        } catch (err) {
          console.error("Error accessing camera:", err);
          setErrorMsg("Gagal mengakses kamera. Pastikan izin kamera diberikan.");
        }
      }
    };
    
    startVideo();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isModelLoaded]);

  // Handle detection loop
  const handleVideoPlay = () => {
    if (!isModelLoaded || !videoRef.current) return;
    
    setIsDetecting(true);
    
    const interval = setInterval(async () => {
      if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
        try {
          const detection = await faceapi.detectSingleFace(videoRef.current)
            .withFaceLandmarks()
            .withFaceDescriptor();
            
          if (detection) {
            // Face found!
            clearInterval(interval);
            setIsDetecting(false);
            
            // Convert Float32Array to standard array for storage
            const descriptorArray = Array.from(detection.descriptor);
            onFaceDetected(descriptorArray);
          }
        } catch (err) {
          console.error("Detection error:", err);
        }
      }
    }, 500); // Check every 500ms
    
    return () => clearInterval(interval);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-800 p-6 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700 flex flex-col items-center">
        <div className="flex justify-between items-center w-full mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Camera className="w-6 h-6 text-brand-400" />
            {title}
          </h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        
        {errorMsg ? (
          <div className="bg-red-500/20 text-red-400 p-4 rounded-xl text-center w-full border border-red-500/30">
            {errorMsg}
          </div>
        ) : (
          <div className="relative w-full aspect-square bg-slate-900 rounded-xl overflow-hidden border-2 border-slate-700 flex items-center justify-center">
            {!isModelLoaded ? (
              <div className="flex flex-col items-center text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin mb-2" />
                <p>Memuat AI Model...</p>
              </div>
            ) : (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  muted 
                  playsInline
                  onPlay={handleVideoPlay}
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }} // Mirror effect
                />
                
                {/* Scanning Overlay */}
                <div className="absolute inset-0 border-4 border-brand-500/50 rounded-xl pointer-events-none"></div>
                <div className="absolute top-0 left-0 w-full h-1 bg-brand-400 shadow-[0_0_15px_rgba(212,154,91,1)] animate-[scan_2s_ease-in-out_infinite]"></div>
                
                {isDetecting && (
                  <div className="absolute bottom-4 left-0 right-0 text-center">
                    <span className="bg-black/60 text-white px-3 py-1 rounded-full text-sm backdrop-blur-md">
                      Mendeteksi wajah...
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        <p className="text-slate-400 text-sm text-center mt-6">
          Posisikan wajah Anda di tengah layar dengan pencahayaan yang cukup.
        </p>
      </div>
      
      <style>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};
