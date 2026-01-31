/**
 * RAGOStand - Minimal Interactions
 * Scroll reveal animations using Intersection Observer
 */

document.addEventListener('DOMContentLoaded', () => {
  // Scroll Reveal Animation
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Parallax effect on hero image (subtle)
  const heroImage = document.querySelector('.hero__image-wrapper');
  
  if (heroImage) {
    let ticking = false;
    
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrolled = window.pageYOffset;
          const rate = scrolled * 0.3;
          
          if (scrolled < window.innerHeight) {
            heroImage.style.transform = `translate(-50%, calc(-50% + ${rate}px))`;
            heroImage.style.opacity = Math.max(0.7 - (scrolled / window.innerHeight) * 0.5, 0.2);
          }
          
          ticking = false;
        });
        
        ticking = true;
      }
    });
  }
});
