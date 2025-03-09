import React, { useEffect, useRef } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  fullHeight?: boolean;
  showHandle?: boolean;
  transparent?: boolean;
}

const BottomSheet: React.FC<BottomSheetProps> = ({ 
  isOpen, 
  onClose, 
  children,
  title,
  fullHeight = false,
  showHandle = true,
  transparent = false
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sheetRef.current && !contentRef.current?.contains(event.target as Node)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  // Handle escape key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);
  
  // Prevent body scrolling when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div 
      ref={sheetRef} 
      className={`fixed inset-0 flex items-end z-[100] ${transparent ? '' : 'bg-black bg-opacity-50'}`}
    >
      <div 
        ref={contentRef}
        className={`w-full bg-white rounded-t-xl ${fullHeight ? 'h-[90vh]' : 'max-h-[90vh]'} overflow-y-auto transform translate-y-0 transition-transform duration-300 ease-out slide-in`}
      >
        {showHandle && <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto my-3" />}
        
        {title && (
          <div className="px-4 py-3 border-b">
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
        )}
        
        <div className={`${!title && !showHandle ? '' : 'p-4'}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default BottomSheet;