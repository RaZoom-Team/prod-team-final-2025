import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getOrganization } from '../../modules/admin/api/organizationApi';
import jsQR from 'jsqr';

interface QRCodeScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onScan, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [lastScanTime, setLastScanTime] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Get organization data for accent color
  const { data: organization } = useQuery({
    queryKey: ['organization'],
    queryFn: getOrganization,
  });
  
  // Initialize camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        // Check if browser supports getUserMedia
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError('Ваш браузер не поддерживает доступ к камере');
          return;
        }
        
        // Get available cameras
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        if (videoDevices.length === 0) {
          setError('Камеры не найдены на этом устройстве');
          return;
        }
        
        setCameras(videoDevices);
        
        // Select the back camera by default if available, otherwise use the first camera
        const backCamera = videoDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('задн')
        );
        
        setSelectedCamera(backCamera ? backCamera.deviceId : videoDevices[0].deviceId);
      } catch (err) {
        if (err instanceof Error && err.name === 'NotAllowedError') {
          setPermissionDenied(true);
        } else {
          setError('Ошибка доступа к камерам: ' + (err instanceof Error ? err.message : String(err)));
        }
        console.error('Camera init error:', err);
      }
    };
    
    initCamera();
    
    // Cleanup function
    return () => {
      stopScanner();
    };
  }, []);
  
  // Start scanning when camera is selected
  useEffect(() => {
    if (selectedCamera && !isScanning) {
      startScanner();
    }
    
    return () => {
      stopScanner();
    };
  }, [selectedCamera]);
  
  const startScanner = async () => {
    if (!selectedCamera || !videoRef.current || !canvasRef.current) return;
    
    try {
      setIsScanning(true);
      setError(null);
      
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Start video stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: selectedCamera },
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      
      // Wait for video to be ready
      await new Promise<void>((resolve) => {
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              videoRef.current.play().then(() => resolve()).catch(err => {
                setError('Не удалось запустить видеопоток: ' + err.message);
                setIsScanning(false);
              });
            }
          };
        }
      });
      
      // Start scanning loop
      scanQRCode();
      
    } catch (err) {
      setIsScanning(false);
      setError('Не удалось запустить камеру: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Start scanner error:', err);
    }
  };
  
  const stopScanner = () => {
    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Stop video stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsScanning(false);
  };
  
  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get image data for QR code scanning
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Scan for QR code
    try {
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });
      
      // If QR code found
      if (code) {
        const now = Date.now();
        
        // Prevent multiple scans of the same code in quick succession (1.5 second cooldown)
        if (code.data !== lastScannedCode || now - lastScanTime > 1500) {
          setLastScannedCode(code.data);
          setLastScanTime(now);
          
          // Draw QR code location
          ctx.lineWidth = 4;
          ctx.strokeStyle = organization?.primaryColor || '#3044FF';
          ctx.beginPath();
          ctx.moveTo(code.location.topLeftCorner.x, code.location.topLeftCorner.y);
          ctx.lineTo(code.location.topRightCorner.x, code.location.topRightCorner.y);
          ctx.lineTo(code.location.bottomRightCorner.x, code.location.bottomRightCorner.y);
          ctx.lineTo(code.location.bottomLeftCorner.x, code.location.bottomLeftCorner.y);
          ctx.lineTo(code.location.topLeftCorner.x, code.location.topLeftCorner.y);
          ctx.stroke();
          
          try {
            // Call onScan callback
            onScan(code.data);
          } catch (error) {
            // Если при обработке QR-кода произошла ошибка, продолжаем сканирование
            console.error('Error processing QR code:', error);
          }
          
          // Pause scanning briefly
          setTimeout(() => {
            if (isScanning) {
              animationFrameRef.current = requestAnimationFrame(scanQRCode);
            }
          }, 1000);
          
          return;
        }
      }
    } catch (err) {
      // Если при сканировании произошла ошибка, логируем ее, но продолжаем сканирование
      console.warn('QR scan error:', err);
    }
    
    // Continue scanning
    animationFrameRef.current = requestAnimationFrame(scanQRCode);
  };
  
  const switchCamera = async () => {
    if (cameras.length <= 1) return;
    
    // Stop current scanner
    stopScanner();
    
    // Find next camera in the list
    const currentIndex = cameras.findIndex(camera => camera.deviceId === selectedCamera);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setSelectedCamera(cameras[nextIndex].deviceId);
  };
  
  const requestCameraPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setPermissionDenied(false);
      
      // Reinitialize cameras
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length > 0) {
        setCameras(videoDevices);
        setSelectedCamera(videoDevices[0].deviceId);
      }
    } catch (err) {
      setError('Доступ к камере запрещен. Пожалуйста, разрешите доступ к камере в настройках браузера.');
      console.error('Permission request error:', err);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="p-4 bg-primary text-white flex justify-between items-center" style={{ backgroundColor: organization?.primaryColor }}>
        <h3 className="text-lg font-semibold">Сканер QR-кода</h3>
        <button 
          onClick={onClose}
          className="p-1 rounded-full hover:bg-white/20 transition-colors"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="flex-1 relative overflow-hidden">
        {permissionDenied ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <Camera size={64} className="text-gray-400 mb-6" />
            <h3 className="text-xl font-medium mb-3 text-white">Требуется доступ к камере</h3>
            <p className="text-gray-300 mb-6 text-center">Для сканирования QR-кодов необходим доступ к камере устройства.</p>
            <button 
              onClick={requestCameraPermission}
              className="btn-primary"
              style={{ backgroundColor: organization?.primaryColor }}
            >
              Разрешить доступ к камере
            </button>
          </div>
        ) : (
          <div className="absolute inset-0">
            {/* Video element (hidden) */}
            <video 
              ref={videoRef} 
              className="absolute opacity-0 pointer-events-none" 
              playsInline 
              muted
            />
            
            {/* Canvas for QR scanning - full screen */}
            <div className="absolute inset-0">
              <canvas 
                ref={canvasRef} 
                className="w-full h-full object-cover"
              />
              
              {/* Scanning overlay with target area */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] border-2 border-dashed border-white rounded-lg">
                  {/* Corner markers */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" style={{ borderColor: organization?.primaryColor }}></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" style={{ borderColor: organization?.primaryColor }}></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" style={{ borderColor: organization?.primaryColor }}></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" style={{ borderColor: organization?.primaryColor }}></div>
                  
                  {/* Scanning line animation */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-1 bg-primary opacity-70 animate-scanline"
                    style={{ backgroundColor: organization?.primaryColor }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* Loading indicator */}
            {!isScanning && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
                <div 
                  className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"
                  style={{ borderColor: organization?.primaryColor }}
                ></div>
              </div>
            )}
            
            {/* Controls at the bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
              {error && (
                <div className="mb-4 p-3 bg-red-900 text-white rounded-md text-sm">
                  {error}
                </div>
              )}
              
              {cameras.length > 1 && (
                <div className="mb-4 flex justify-center">
                  <button 
                    onClick={switchCamera}
                    className="flex items-center text-white bg-primary/80 hover:bg-primary px-4 py-2 rounded-full"
                    style={{ backgroundColor: `${organization?.primaryColor}cc` }}
                  >
                    <RefreshCw size={18} className="mr-2" />
                    Сменить камеру ({cameras.findIndex(camera => camera.deviceId === selectedCamera) + 1}/{cameras.length})
                  </button>
                </div>
              )}
              
              <div className="text-center text-white">
                Наведите камеру на QR-код для сканирования
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRCodeScanner;