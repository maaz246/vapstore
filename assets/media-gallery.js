if (!customElements.get('media-gallery')) {
  customElements.define(
    'media-gallery',
    class MediaGallery extends HTMLElement {
      constructor() {
        super();
        this.elements = {
          liveRegion: this.querySelector('[id^="GalleryStatus"]'),
          viewer: this.querySelector('[id^="GalleryViewer"]'),
          thumbnails: this.querySelector('[id^="GalleryThumbnails"]'),
        };
        this.mql = window.matchMedia('(min-width: 750px)');
        if (!this.elements.viewer) return;

        // Attach viewer navigation arrows
        const viewerPrev = this.elements.viewer.querySelector('button[name="previous"]');
        const viewerNext = this.elements.viewer.querySelector('button[name="next"]');
        if (viewerPrev) viewerPrev.addEventListener('click', this.onViewerNavClick.bind(this, -1));
        if (viewerNext) viewerNext.addEventListener('click', this.onViewerNavClick.bind(this, 1));

        if (!this.elements.thumbnails) return;

        this.elements.viewer.addEventListener('slideChanged', debounce(this.onSlideChanged.bind(this), 300));
        
        // Support both click and hover (mouseenter) with smooth upward/downward slide
        this.elements.thumbnails.querySelectorAll('[data-target]').forEach((mediaToSwitch) => {
          const button = mediaToSwitch.querySelector('button');
          if (button) {
            button.addEventListener('click', (e) => {
              e.preventDefault();
              this.setActiveMedia(mediaToSwitch.dataset.target, false);
            });
          }
          mediaToSwitch.addEventListener('mouseenter', () => {
            this.setActiveMedia(mediaToSwitch.dataset.target, false);
          });
        });

        if (this.dataset.desktopLayout && this.dataset.desktopLayout.includes('thumbnail') && this.mql.matches) {
          this.removeListSemantic();
        }
      }

      onViewerNavClick(direction, event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        const items = Array.from(
          this.elements.thumbnails
            ? this.elements.thumbnails.querySelectorAll('[data-target]')
            : this.elements.viewer.querySelectorAll('[data-media-id]')
        );
        if (items.length <= 1) return;

        let currentIndex = items.findIndex((item) => {
          const button = item.querySelector('button');
          return button ? button.getAttribute('aria-current') === 'true' : item.classList.contains('is-active');
        });

        if (currentIndex === -1) currentIndex = 0;

        let nextIndex = currentIndex + direction;
        if (nextIndex < 0) nextIndex = items.length - 1; // cyclic loop to end
        if (nextIndex >= items.length) nextIndex = 0; // cyclic loop to start

        const nextItem = items[nextIndex];
        const targetId = nextItem.dataset.target || nextItem.dataset.mediaId;
        if (targetId) {
          this.setActiveMedia(targetId, false);
        }
      }

      onSlideChanged(event) {
        if (!this.elements.thumbnails) return;
        const thumbnail = this.elements.thumbnails.querySelector(
          `[data-target="${event.detail.currentElement.dataset.mediaId}"]`
        );
        this.setActiveThumbnail(thumbnail);
      }

      setActiveMedia(mediaId, prepend) {
        const activeMedia =
          this.elements.viewer.querySelector(`[data-media-id="${mediaId}"]`) ||
          this.elements.viewer.querySelector('[data-media-id]');
        if (!activeMedia) {
          return;
        }
        this.elements.viewer.querySelectorAll('[data-media-id]').forEach((element) => {
          element.classList.remove('is-active');
        });
        activeMedia?.classList?.add('is-active');

        if (prepend) {
          activeMedia.parentElement.firstChild !== activeMedia && activeMedia.parentElement.prepend(activeMedia);

          if (this.elements.thumbnails) {
            const activeThumbnail = this.elements.thumbnails.querySelector(`[data-target="${mediaId}"]`);
            activeThumbnail &&
              activeThumbnail.parentElement.firstChild !== activeThumbnail &&
              activeThumbnail.parentElement.prepend(activeThumbnail);
          }

          if (this.elements.viewer.slider) this.elements.viewer.resetPages();
        }

        this.preventStickyHeader();
        window.setTimeout(() => {
          if (activeMedia.parentElement) {
            activeMedia.parentElement.scrollTo({
              left: activeMedia.offsetLeft,
              behavior: 'smooth'
            });
          }
        }, 10);
        this.playActiveMedia(activeMedia);

        if (typeof initSmoothHoverZoom === 'function') {
          initSmoothHoverZoom();
        }

        if (!this.elements.thumbnails) return;
        const activeThumbnail = this.elements.thumbnails.querySelector(`[data-target="${mediaId}"]`);
        this.setActiveThumbnail(activeThumbnail);
        if (activeThumbnail && activeThumbnail.dataset.mediaPosition) {
          this.announceLiveRegion(activeMedia, activeThumbnail.dataset.mediaPosition);
        }
      }

      setActiveThumbnail(thumbnail) {
        if (!this.elements.thumbnails || !thumbnail) return;

        this.elements.thumbnails
          .querySelectorAll('button')
          .forEach((element) => element.removeAttribute('aria-current'));
        this.elements.thumbnails
          .querySelectorAll('[data-target]')
          .forEach((element) => element.classList.remove('is-active'));

        const button = thumbnail.querySelector('button');
        if (button) button.setAttribute('aria-current', 'true');
        thumbnail.classList.add('is-active');

        const thumbnailList =
          this.elements.thumbnails.querySelector('.thumbnail-list') ||
          this.elements.thumbnails.querySelector('ul') ||
          this.elements.thumbnails.slider;

        if (thumbnailList) {
          if (this.mql.matches) {
            // Smooth vertical upward/downward slide
            const targetScrollTop =
              thumbnail.offsetTop - thumbnailList.clientHeight / 2 + thumbnail.clientHeight / 2;
            thumbnailList.scrollTo({
              top: Math.max(0, targetScrollTop),
              behavior: 'smooth',
            });
          } else {
            // Smooth horizontal slide on mobile
            const targetScrollLeft =
              thumbnail.offsetLeft - thumbnailList.clientWidth / 2 + thumbnail.clientWidth / 2;
            thumbnailList.scrollTo({
              left: Math.max(0, targetScrollLeft),
              behavior: 'smooth',
            });
          }
        }
      }

      announceLiveRegion(activeItem, position) {
        const image = activeItem.querySelector('.product__modal-opener--image img');
        if (!image || !this.elements.liveRegion) return;
        image.onload = () => {
          this.elements.liveRegion.setAttribute('aria-hidden', false);
          this.elements.liveRegion.innerHTML = (window.accessibilityStrings?.imageAvailable || '').replace(
            '[index]',
            position
          );
          setTimeout(() => {
            this.elements.liveRegion.setAttribute('aria-hidden', true);
          }, 2000);
        };
        image.src = image.src;
      }

      playActiveMedia(activeItem) {
        if (typeof window.pauseAllMedia === 'function') window.pauseAllMedia();
        const deferredMedia = activeItem.querySelector('.deferred-media');
        if (deferredMedia && typeof deferredMedia.loadContent === 'function') deferredMedia.loadContent(false);
      }

      preventStickyHeader() {
        this.stickyHeader = this.stickyHeader || document.querySelector('sticky-header');
        if (!this.stickyHeader) return;
        this.stickyHeader.dispatchEvent(new Event('preventHeaderReveal'));
      }

      removeListSemantic() {
        if (!this.elements.viewer?.slider) return;
        this.elements.viewer.slider.setAttribute('role', 'presentation');
        if (this.elements.viewer.sliderItems) {
          this.elements.viewer.sliderItems.forEach((slide) => slide.setAttribute('role', 'presentation'));
        }
      }
    }
  );
}
