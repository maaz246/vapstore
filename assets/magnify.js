// Smooth interactive automatic hover zoom for main product media
function initSmoothHoverZoom(zoomRatio = 2.2) {
  const openers = document.querySelectorAll('.product__modal-opener--image');
  openers.forEach((opener) => {
    if (opener.dataset.hoverZoomActive === 'true') return;
    opener.dataset.hoverZoomActive = 'true';

    const img = opener.querySelector('img');
    if (!img) return;

    opener.style.overflow = 'hidden';
    opener.style.position = 'relative';
    img.style.transformOrigin = 'center center';
    img.style.transform = 'scale(1)';

    opener.addEventListener('mouseenter', (e) => {
      if (window.matchMedia('(max-width: 749px)').matches) return;
      img.style.transition = 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
      const rect = opener.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      img.style.transformOrigin = `${x}% ${y}%`;
      img.style.transform = `scale(${zoomRatio})`;
    });

    opener.addEventListener('mousemove', (e) => {
      if (window.matchMedia('(max-width: 749px)').matches) return;
      const rect = opener.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      img.style.transformOrigin = `${x}% ${y}%`;
      img.style.transform = `scale(${zoomRatio})`;
    });

    opener.addEventListener('mouseleave', () => {
      img.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
      img.style.transform = 'scale(1)';
      setTimeout(() => {
        img.style.transformOrigin = 'center center';
      }, 400);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initSmoothHoverZoom(2.2);
});

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initSmoothHoverZoom(2.2);
}

document.addEventListener('shopify:section:load', () => {
  initSmoothHoverZoom(2.2);
});
