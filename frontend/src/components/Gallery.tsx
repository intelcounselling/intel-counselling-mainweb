import React, { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

// Playful touches: each tile leans a little and wears a pastel frame
const TILTS = [-2, 1.5, -1, 2, -1.5, 1];
const FRAMES = ['#E6DEEC', '#DCE8DC', '#F6DCC8', '#DCE6EE', '#F7EBD3'];
import { LazyImage } from './ui/LazyImage';

const Gallery: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedImage, setSelectedImage] = useState<{ id: number; src: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const draggedRef = useRef(false);

  const images = Array.from({ length: 14 }, (_, i) => ({
    id: i + 1,
    src: `/assets/imgs/gallery/${i + 1}.jpeg`,
  }));
  const displayImages = [...images, ...images];

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let raf: number;
    const tick = () => {
      if (!draggedRef.current) {
        el.scrollLeft += 0.8;
        if (el.scrollLeft >= el.scrollWidth / 2) el.scrollLeft = 0;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    const el = scrollRef.current; if (!el) return;
    draggedRef.current = false;
    setIsDragging(true);
    setStartX(e.pageX - el.offsetLeft);
    setScrollLeftState(el.scrollLeft);
  };
  const onTouchStart = (e: React.TouchEvent) => {
    const el = scrollRef.current; if (!el) return;
    draggedRef.current = false;
    setStartX(e.touches[0].pageX - el.offsetLeft);
    setScrollLeftState(el.scrollLeft);
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const el = scrollRef.current; if (!el) return;
    e.preventDefault();
    draggedRef.current = true;
    el.scrollLeft = scrollLeftState - (e.pageX - el.offsetLeft - startX) * 1.4;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const el = scrollRef.current; if (!el) return;
    draggedRef.current = true;
    el.scrollLeft = scrollLeftState - (e.touches[0].pageX - el.offsetLeft - startX);
  };
  const stopDrag = () => {
    setIsDragging(false);
    setTimeout(() => { draggedRef.current = false; }, 80);
  };

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = selectedImage ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [selectedImage]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedImage) return;
    const i = images.findIndex(img => img.id === selectedImage.id);
    setSelectedImage(images[(i - 1 + images.length) % images.length]);
  };
  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedImage) return;
    const i = images.findIndex(img => img.id === selectedImage.id);
    setSelectedImage(images[(i + 1) % images.length]);
  };

  // Responsive Carousel heights and widths
  const carouselH = typeof window !== 'undefined' && window.innerWidth < 640 ? 180 : 260;
  const cardW = typeof window !== 'undefined' && window.innerWidth < 640 ? 240 : 360;
  const gap = 16;

  return (
    <section id="gallery" className="bg-[#1A1A1A] py-12 md:py-16 scroll-mt-20 overflow-hidden select-none">
      <div className="relative">
        <div className="pointer-events-none absolute -left-24 top-1/3 w-80 h-80 rounded-full bg-[#78A083]/20 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-24 bottom-0 w-96 h-96 rounded-full bg-[#C19B6C]/15 blur-3xl" aria-hidden="true" />
        {/* Header */}
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 mb-8 sm:mb-10">
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-terracotta mb-3"><Sparkles size={14} /> Gallery</p>
          <h2 className="serif text-3xl md:text-[2.75rem] leading-tight text-[#F4EFE6]">Moments from <span className="italic text-terracotta">our work</span></h2>
          <p className="mt-4 text-base md:text-lg text-white/60">Drag or scroll to browse. Select a photo to enlarge it.</p>
        </div>

        {/* Scroll strip */}
        <div className="relative group">
          {/* Edge fades */}
          <div className="absolute inset-y-0 left-0 w-12 sm:w-20 md:w-28 z-10 pointer-events-none
                          bg-gradient-to-r from-[#1A1A1A] to-transparent" />
          <div className="absolute inset-y-0 right-0 w-12 sm:w-20 md:w-28 z-10 pointer-events-none
                          bg-gradient-to-l from-[#1A1A1A] to-transparent" />

          <div
            ref={scrollRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={stopDrag}
            onMouseLeave={stopDrag}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={stopDrag}
            className={`flex items-center overflow-x-auto overflow-y-hidden px-4 sm:px-8 md:px-14
                        [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden
                        ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{ height: `${carouselH + 48}px` }}
          >
            <div
              className="flex items-center"
              style={{ gap: `${gap}px`, height: `${carouselH}px` }}
            >
              {displayImages.map((img, index) => {
                return (
                  <div
                    key={`${img.id}-${index}`}
                    onClick={() => { if (!draggedRef.current) setSelectedImage(img); }}
                    className="relative overflow-hidden rounded-2xl md:rounded-[28px] p-1.5 sm:p-2
                               group/tile cursor-pointer shrink-0 shadow-[0_10px_26px_rgba(0,0,0,0.4)]
                               transition-transform duration-500 ease-bounce
                               [transform:rotate(var(--r))] hover:[transform:rotate(0deg)_translateY(-6px)_scale(1.05)]"
                    style={{
                      width: `${cardW}px`,
                      minWidth: `${cardW}px`,
                      height: `${carouselH}px`,
                      backgroundColor: FRAMES[index % FRAMES.length],
                      ['--r' as string]: `${TILTS[index % TILTS.length]}deg`,
                    }}
                  >
                    <LazyImage
                      src={img.src}
                      alt={`Gallery ${img.id}`}
                      draggable={false}
                      wrapperClassName="!bg-transparent rounded-xl md:rounded-[22px]"
                      className="w-full h-full object-cover pointer-events-none
                                 transition-transform duration-[2000ms] ease-out
                                 group-hover/tile:scale-[1.04]"
                    />
                    <span className="absolute bottom-4 right-4 sm:bottom-5 sm:right-5 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-intel-dark
                                     opacity-0 translate-y-1 transition-all duration-300 group-hover/tile:opacity-100 group-hover/tile:translate-y-0">
                      View
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 md:p-12"
          style={{ backgroundColor: 'rgba(0,0,0,0.94)' }}
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10
                       hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all z-10"
            onClick={() => setSelectedImage(null)}
          >
            <X size={18} />
          </button>
          <button
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2
                       w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/8 hover:bg-white/15
                       border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all z-10"
            onClick={handlePrev}
          >
            <ChevronLeft size={20} />
          </button>
          <div className="relative max-w-5xl w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <LazyImage
              key={selectedImage.src}
              src={selectedImage.src}
              alt="Gallery expanded"
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            />
            <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-white/35 text-[11px] font-bold tracking-[0.14em] uppercase">
              {String(images.findIndex(img => img.id === selectedImage.id) + 1).padStart(2, '0')} / {images.length}
            </div>
          </div>
          <button
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2
                       w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/8 hover:bg-white/15
                       border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all z-10"
            onClick={handleNext}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </section>
  );
};

export default Gallery;
