import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Clock, ArrowLeft, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getCoworkingById, getPlaces } from '../modules/cowork/api';
import { getCurrentUser } from '../modules/user/api/userApi';
import { getOrganization } from '../modules/admin/api/organizationApi';
import SpaceList from '../modules/cowork/components/SpaceList';
import LeafletMap from '../modules/cowork/components/LeafletMap';
import FloorMapViewerLeaflet from '../modules/cowork/components/FloorMapViewerLeaflet';
import { ROUTES } from '../config';
import Modal from '../shared/components/Modal';
import BottomSheet from '../shared/components/BottomSheet';

const CoworkingDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('map');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
  });

  const { data: organization } = useQuery({
    queryKey: ['organization'],
    queryFn: getOrganization,
  });

  const { data: coworking, isLoading: isLoadingCoworking } = useQuery({
    queryKey: ['coworking', id],
    queryFn: () => getCoworkingById(id!),
    enabled: !!id,
  });

  const { data: spaces = [], isLoading: isLoadingSpaces } = useQuery({
    queryKey: ['spaces', id],
    queryFn: () => getPlaces(id),
    enabled: !!id,
  });

  const isLoading = isLoadingCoworking || isLoadingSpaces;

  // Check if device is mobile on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const openGallery = (index: number = 0) => {
    if (!coworking || !coworking.photos || coworking.photos.length === 0) return;
    setActivePhotoIndex(index);
    setGalleryOpen(true);
  };

  const closeGallery = () => {
    setGalleryOpen(false);
  };

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!coworking) return;
    setActivePhotoIndex((prev) => (prev + 1) % coworking.photos.length);
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!coworking) return;
    setActivePhotoIndex((prev) => (prev - 1 + coworking.photos.length) % coworking.photos.length);
  };

  // Format time for display
  const formatTime = (hour: number | null): string => {
    if (hour === null) return 'Not set';
    return `${String(hour).padStart(2, '0')}:00`;
  };

  // Check if coworking has working hours
  const hasWorkingHours = (coworking: any): boolean => {
    return coworking.open_from !== null && coworking.open_till !== null;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!coworking) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Coworking not found.</p>
        <button 
          onClick={() => navigate(ROUTES.HOME)}
          className="mt-4 btn-primary"
          style={{ backgroundColor: organization?.primaryColor }}
        >
          Return to Home
        </button>
      </div>
    );
  }

  // Gallery content shared between modal and bottom sheet
  const galleryContent = (
    <div className="relative h-[70vh]">
      {/* Close button */}
      <button 
        className="absolute top-2 right-2 z-10 bg-black/30 text-white p-1.5 rounded-full"
        onClick={closeGallery}
      >
        <X size={20} />
      </button>
      
      {/* Navigation buttons */}
      <button 
        className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-black/30 text-white p-1.5 rounded-full"
        onClick={prevPhoto}
      >
        <ChevronLeft size={20} />
      </button>
      
      <button 
        className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-black/30 text-white p-1.5 rounded-full"
        onClick={nextPhoto}
      >
        <ChevronRight size={20} />
      </button>
      
      {/* Current photo */}
      <img 
        src={coworking.photos[activePhotoIndex]} 
        alt={`${coworking.name} - Photo ${activePhotoIndex + 1}`}
        className="w-full h-full object-contain"
      />
      
      {/* Photo counter */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/30 text-white px-2 py-1 rounded-full text-xs">
        {activePhotoIndex + 1} / {coworking.photos.length}
      </div>
    </div>
  );

  // Thumbnails for gallery
  const thumbnailsContent = (
    <div className="mt-4 overflow-x-auto no-scrollbar">
      <div className="flex space-x-2 pb-2">
        {coworking.photos.map((photo: string, index: number) => (
          <div 
            key={index} 
            className={`w-16 h-16 flex-shrink-0 rounded-md overflow-hidden cursor-pointer ${
              index === activePhotoIndex ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setActivePhotoIndex(index)}
            style={index === activePhotoIndex ? { borderColor: organization?.primaryColor } : undefined}
          >
            <img 
              src={photo} 
              alt={`${coworking.name} - Thumbnail ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} className="mr-2" />
        Back
      </button>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-8">
        <div className="relative h-80">
          <img 
            src={coworking.photos[0]} 
            alt={coworking.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
            <div className="p-6 text-white">
              <h1 className="text-3xl font-bold">{coworking.name}</h1>
              <div className="flex items-center mt-2">
                <MapPin size={18} className="mr-2" />
                <span>{coworking.address}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center px-3 py-1 bg-gray-100 rounded-full text-gray-700">
              <Clock size={16} className="mr-2" />
              {hasWorkingHours(coworking) ? (
                <span>
                  {formatTime(coworking.open_from)} - {formatTime(coworking.open_till)}
                </span>
              ) : (
                <span>Open 24/7</span>
              )}
            </div>
            <div className="px-3 py-1 bg-gray-100 rounded-full text-gray-700">
              {spaces.length} available spaces
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-4">About</h2>
          <p className="text-gray-600 mb-8">{coworking.description}</p>

          <h2 className="text-xl font-semibold mb-4">Location</h2>
          <div className="mb-8 h-64 z-0 relative">
            <LeafletMap 
              coworkings={[coworking]} 
              selectedCoworking={coworking}
              height="100%"
              interactive={false}
            />
          </div>

          {coworking.photos.length > 1 && (
            <>
              <h2 className="text-xl font-semibold mb-4">Photos</h2>
              <div className="mb-8 z-10 relative">
                {/* Photo Gallery Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {/* First photo larger */}
                  <div 
                    className="col-span-2 row-span-2 rounded-xl overflow-hidden cursor-pointer"
                    onClick={() => openGallery(0)}
                  >
                    <img 
                      src={coworking.photos[0]} 
                      alt={`${coworking.name} - Photo 1`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  
                  {/* Other photos */}
                  {coworking.photos.slice(1, 5).map((photo: string, index: number) => (
                    <div 
                      key={index + 1} 
                      className="rounded-xl overflow-hidden cursor-pointer"
                      onClick={() => openGallery(index + 1)}
                    >
                      <img 
                        src={photo} 
                        alt={`${coworking.name} - Photo ${index + 2}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
                
                {/* View all photos button */}
                {coworking.photos.length > 5 && (
                  <button 
                    className="mt-2 text-primary font-medium flex items-center"
                    onClick={() => openGallery(0)}
                    style={{ color: organization?.primaryColor }}
                  >
                    View all {coworking.photos.length} photos
                  </button>
                )}
              </div>
            </>
          )}

          <h2 className="text-xl font-semibold mb-4">Available Spaces</h2>
          
          {/* View mode toggle */}
          <div className="flex mb-4 border-b border-gray-200">
            <button
              className={`pb-2 px-4 font-medium ${
                viewMode === 'list' 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setViewMode('list')}
              style={viewMode === 'list' ? { 
                color: organization?.primaryColor,
                borderColor: organization?.primaryColor 
              } : undefined}
            >
              List View
            </button>
            <button
              className={`pb-2 px-4 font-medium ${
                viewMode === 'map' 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setViewMode('map')}
              style={viewMode === 'map' ? { 
                color: organization?.primaryColor,
                borderColor: organization?.primaryColor 
              } : undefined}
            >
              Floor Map
            </button>
          </div>
          
          {viewMode === 'list' ? (
            spaces.length > 0 ? (
              <SpaceList spaces={spaces} />
            ) : (
              <p className="text-gray-600">No available spaces in this coworking.</p>
            )
          ) : (
            coworking.floors && coworking.floors.length > 0 ? (
              <FloorMapViewerLeaflet floors={coworking.floors} coworkingId={coworking.id} />
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No floor plans available for this coworking.</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Desktop: Photo Gallery Modal */}
      {!isMobile && (
        <Modal
          isOpen={galleryOpen}
          onClose={closeGallery}
          title=""
          maxWidth="max-w-5xl"
          showCloseButton={false}
          noPadding={true}
        >
          <div className="bg-black">
            {galleryContent}
            {thumbnailsContent}
          </div>
        </Modal>
      )}

      {/* Mobile: Photo Gallery Bottom Sheet */}
      {isMobile && (
        <BottomSheet
          isOpen={galleryOpen}
          onClose={closeGallery}
          fullHeight={true}
          showHandle={false}
          transparent={false}
        >
          <div className="bg-black h-full">
            {galleryContent}
            {thumbnailsContent}
          </div>
        </BottomSheet>
      )}
    </div>
  );
};

export default CoworkingDetailsPage;