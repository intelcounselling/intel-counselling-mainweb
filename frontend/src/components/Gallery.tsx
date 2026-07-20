
import React, { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

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

  // Tile config — smaller on mobile
  const getTile = (index: number): { colSpan: number } => {
    const i = index % 14;
    // wide tiles at positions: 0, 3, 7, 10, 13
    const wide = [0, 3, 7, 10, 13];
    return { colSpan: wide.includes(i) ? 2 : 1 };
  };

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

  // Responsive row height
  const rowH = typeof window !== 'undefined' && window.innerWidth < 640 ? 130 : 200;
  const gap = 10;
  const totalH = rowH * 2 + gap;
  // Responsive tile width
  const tileW = typeof window !== 'undefined' && window.innerWidth < 640 ? 120 : 200;
  const wideTileW = tileW * 2 + gap;

  return (
    <section id="gallery" className="bg-[#1A1A1A] py-14 sm:py-20 md:py-24 scroll-mt-20 overflow-hidden select-none">
      <div>
        {/* Header */}
        <div className="text-center px-4 sm:px-6 mb-10 sm:mb-14">
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-black serif text-[#F4EFE6] mb-3 sm:mb-4 tracking-tight">
            Gallery
          </h2>
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <span className="h-px w-8 sm:w-12 bg-white/10" />
            <p className="text-[9px] sm:text-[10px] md:text-xs text-white/40 font-bold tracking-[0.3em] sm:tracking-[0.4em] uppercase">
              Healing Spaces · Our Clinic
            </p>
            <span className="h-px w-8 sm:w-12 bg-white/10" />
          </div>
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
            className={`flex overflow-x-auto overflow-y-hidden px-4 sm:px-8 md:px-14 pb-2
                        [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden
                        ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{ height: `${totalH + 12}px` }}
          >
            <div
              className="grid grid-rows-2 grid-flow-col"
              style={{ gap: `${gap}px`, height: `${totalH}px` }}
            >
              {displayImages.map((img, index) => {
                const tile = getTile(index);
                const isWide = tile.colSpan === 2;
                const w = isWide ? wideTileW : tileW;
                return (
                  <div
                    key={`${img.id}-${index}`}
                    onClick={() => { if (!draggedRef.current) setSelectedImage(img); }}
                    className="relative overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl
                               bg-[#2A2825] border border-white/[0.07]
                               group/tile cursor-pointer shrink-0
                               transition-all duration-500
                               hover:border-white/20"
                    style={{
                      width: `${w}px`,
                      minWidth: `${w}px`,
                      gridRow: 'span 1',
                      height: `${rowH}px`,
                    }}
                  >
                    <img
                      src={img.src}
                      alt={`Gallery ${img.id}`}
                      draggable={false}
                      loading={index < 8 ? 'eager' : 'lazy'}
                      className="w-full h-full object-contain pointer-events-none
                                 transition-transform duration-[2000ms] ease-out
                                 group-hover/tile:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover/tile:bg-black/15
                                    transition-colors duration-400 flex items-center justify-center">
                      <span className="opacity-0 group-hover/tile:opacity-100 transition-opacity duration-300
                                       text-white/80 text-[10px] font-semibold tracking-widest uppercase">
                        View
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quote */}
        <div className="mt-8 sm:mt-12 text-center px-6">
          <p className="text-white/20 font-serif italic text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            "Environment is the silent counselor. Every corner is designed to bring you closer to clarity."
          </p>
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
            <img
              key={selectedImage.src}
              src={selectedImage.src}
              alt="Gallery expanded"
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            />
            <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-white/35 text-[10px] font-bold tracking-[0.3em] uppercase">
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
