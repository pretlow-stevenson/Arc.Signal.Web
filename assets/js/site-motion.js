(() => {
  // Content starts visible. Motion is an optional, one-time enhancement.
  if (!('IntersectionObserver' in window) || !window.matchMedia) return;
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (preference.matches) return;

  const targets = document.querySelectorAll(
    '.hero-copy, .hero-product, .section-intro, .product-card-visual, ' +
    '.screenshot-grid > figure, .three-column > article, .feature-grid > article'
  );
  const observer = new IntersectionObserver(entries => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      observer.unobserve(target);
      // Preserve immediate access when following an anchor or using a keyboard.
      if (preference.matches || location.hash || target.matches(':focus-within')) continue;
      target.classList.add('is-revealing');
      target.addEventListener('animationend', () => target.classList.remove('is-revealing'), { once: true });
    }
  }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });

  for (const target of targets) {
    const image = target.querySelector('img');
    if (image && !image.complete) {
      image.addEventListener('load', () => {
        if (!preference.matches) observer.observe(target);
      }, { once: true });
    } else {
      observer.observe(target);
    }
  }
  preference.addEventListener('change', () => {
    if (!preference.matches) return;
    observer.disconnect();
    for (const target of targets) target.classList.remove('is-revealing');
  });
})();
