/// <reference types="vite/client" />

declare module 'react-qr-reader' {
  export interface QrReaderProps {
    constraints?: MediaTrackConstraints;
    onResult?: (result: { text: string } | null) => void;
    scanDelay?: number;
    videoId?: string;
    videoStyle?: React.CSSProperties;
    videoContainerStyle?: React.CSSProperties;
    onError?: (error: any) => void;
    ViewFinder?: React.ComponentType;
  }

  export const QrReader: React.FC<QrReaderProps>;
}