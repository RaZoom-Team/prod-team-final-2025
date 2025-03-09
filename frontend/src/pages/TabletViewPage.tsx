import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { Users, Clock } from 'lucide-react';
import { getOrganization } from '../modules/admin/api/organizationApi';
import { API_BASE_URL } from '../config';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';

interface Event {
  id: string;
  visitFrom: Date;
  visitTill: Date;
  placeId: number;
  clientName: string;
}

const TabletViewPage: React.FC = () => {
  const { buildingId, placeId } = useParams<{ buildingId: string; placeId: string }>();
  const mainRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  const [mainRefLastUserScrollState, setMainRefLastUserScrollState] = useState<number>(new Date().getTime() - 15000);
  const [eventsData, setEventsData] = useState<Event[]>([]);

  // Получаем настройки организации
  const { data: organization } = useQuery({
    queryKey: ['organization'],
    queryFn: getOrganization,
  });

  // Получаем данные о месте
  const { data: place } = useQuery({
    queryKey: ['tablet-place', buildingId, placeId],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/buildings/${buildingId}/schemes/places/${placeId}`);
      return {
        name: response.data.name,
        features: response.data.features,
        size: response.data.size,
        rotate: response.data.rotate,
        x: response.data.x,
        y: response.data.y,
        imageId: response.data.image_id,
        id: response.data.id,
        buildingId: response.data.building_id,
        floor: response.data.floor,
        imageUrl: response.data.image_url,
      };
    },
    refetchInterval: 10000,
  });

  // Получаем события для места
  useQuery({
    queryKey: ['tablet-events', buildingId, placeId],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/buildings/${buildingId}/schemes/visits`);
      const events = response.data.map((event: any) => ({
        id: uuidv4(),
        visitFrom: new Date(event.visit_from),
        visitTill: new Date(event.visit_till),
        placeId: event.place_id,
        clientName: event.client_name,
      }));

      const filteredEvents = _.sortBy(
        events.filter((event: Event) => {
          const today = new Date();
          const eventDate = event.visitFrom;
          return event.placeId === Number(placeId) &&
            eventDate.getFullYear() === today.getFullYear() &&
            eventDate.getMonth() === today.getMonth() &&
            eventDate.getDate() === today.getDate();
        }),
        'visitFrom'
      );

      setEventsData(filteredEvents);
    },
    refetchInterval: 10000,
  });

  // Обработка скролла
  useEffect(() => {
    const handleScroll = () => {
      setMainRefLastUserScrollState(new Date().getTime());
    };

    mainRef.current?.addEventListener('wheel', handleScroll);
    return () => mainRef.current?.removeEventListener('wheel', handleScroll);
  }, []);

  // Автоскролл к текущему времени
  useEffect(() => {
    const refreshCurrentDatetime = () => {
      if (timelineRef.current && mainRef.current) {
        const currentDatetime = new Date();
        if (new Date().getTime() - mainRefLastUserScrollState >= 15000) {
          mainRef.current.scroll({
            behavior: 'smooth',
            top: (timelineRef.current.getBoundingClientRect().height / 144 * 
              Math.floor(currentDatetime.getHours() * 6 + currentDatetime.getMinutes() / 10)),
          });
        }
      }
    };

    const interval = setInterval(refreshCurrentDatetime, 1000);
    refreshCurrentDatetime();

    return () => clearInterval(interval);
  }, [mainRef, timelineRef, mainRefLastUserScrollState]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div className="flex items-stretch w-full max-w-full min-h-screen bg-slate-50">
      {/* QR Code Section */}
      <div className="flex flex-col items-center z-30 max-w-[40%] p-16 bg-white shadow-lg">
        <div className="flex justify-center items-center py-8">
          <div 
            className="p-8 bg-white rounded-3xl transition-shadow"
            style={{ 
              boxShadow: `0 0 0 2px ${organization?.primaryColor}20` 
            }}
          >
            <QRCodeSVG
              value={`${window.location.origin}/buildings/${buildingId}/places/${placeId}`}
              size={240}
              level="M"
              fgColor={organization?.primaryColor || '#000000'}
              bgColor="#FFFFFF"
            />
          </div>
        </div>
        <p className="text-center text-2xl font-bold tracking-tight">
          Или перейдите по ссылке:
          <br />
          <span className="text-xl tracking-wide break-all">
            {`${window.location.origin}/buildings/${buildingId}/places/${placeId}`}
          </span>
        </p>
      </div>

      {/* Timeline Section */}
      <div className="flex-1 max-h-screen overflow-y-auto" ref={mainRef}>
        <div className="sticky top-0 z-10 w-full pb-8">
          <div className="flex items-center w-full h-24 px-16 bg-gradient-to-b from-slate-100 to-transparent">
            <h1 className="text-3xl font-bold tracking-wide">
              {place?.name}
            </h1>
          </div>
        </div>

        <div className="px-16 pb-16">
          <div className="flex gap-4 items-stretch py-4">
            {/* Time Labels */}
            <div 
              className="flex flex-col items-stretch gap-12 text-2xl font-bold"
              style={{ color: `${organization?.primaryColor}C0` }}
            >
              {Array.from({ length: 145 }, (_, i) => (
                <div key={i} className="flex justify-end items-center h-px">
                  {`${Math.floor((i * 10) / 60)}:${String((i * 10) % 60).padStart(2, '0')}`}
                </div>
              ))}
            </div>

            {/* Events Timeline */}
            <div 
              ref={timelineRef}
              className="relative flex-1 bg-slate-100"
              style={{ backgroundColor: `${organization?.primaryColor}06` }}
            >
              {/* Events */}
              <div className="absolute inset-0 grid grid-rows-[repeat(144,48px)] gap-px px-4 py-px">
                {eventsData.map((event, index) => {
                  const dayStart = new Date();
                  dayStart.setHours(0, 0, 0, 0);
                  
                  const dayEnd = new Date();
                  dayEnd.setHours(23, 59, 59, 999);

                  const eventSpan = Math.floor((event.visitTill.getTime() - event.visitFrom.getTime()) / 600000);
                  const beforeSpan = index === 0 
                    ? Math.floor((event.visitFrom.getTime() - dayStart.getTime()) / 600000)
                    : Math.floor((event.visitFrom.getTime() - eventsData[index - 1].visitTill.getTime()) / 600000);
                  const afterSpan = index === eventsData.length - 1
                    ? Math.floor((dayEnd.getTime() - event.visitTill.getTime()) / 600000)
                    : Math.floor((eventsData[index + 1].visitFrom.getTime() - event.visitTill.getTime()) / 600000);

                  return (
                    <React.Fragment key={event.id}>
                      {beforeSpan > 0 && (
                        <div style={{ gridRow: `span ${beforeSpan}` }} />
                      )}
                      <div
                        className="flex justify-center py-1.5"
                        style={{ gridRow: `span ${eventSpan}` }}
                      >
                        <div className="flex w-full py-2 bg-white rounded-lg shadow-md">
                          <div className="sticky top-32 flex justify-between w-full px-4">
                            <div className="flex items-center gap-2">
                              <Users size={16} className="text-slate-600" />
                              <span className="text-slate-500 text-sm font-bold truncate">
                                {event.clientName}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock size={16} className="text-slate-600" />
                              <span className="text-slate-500 text-sm font-bold">
                                {`${event.visitFrom.getHours()}:${String(event.visitFrom.getMinutes()).padStart(2, '0')}`} – 
                                {`${event.visitTill.getHours()}:${String(event.visitTill.getMinutes()).padStart(2, '0')}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {afterSpan > 0 && (
                        <div style={{ gridRow: `span ${afterSpan}` }} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Timeline Grid */}
              {Array.from({ length: 145 }, (_, i) => (
                <div
                  key={i}
                  className="h-px"
                  style={{ backgroundColor: `${organization?.primaryColor}60` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TabletViewPage;