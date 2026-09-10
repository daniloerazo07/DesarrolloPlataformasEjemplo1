const navToggle = document.querySelector('.nav-toggle');
const header = document.querySelector('.site-header');
const navLinks = Array.from(document.querySelectorAll('.nav-link'));

if (navToggle && header) {
  navToggle.addEventListener('click', () => {
    const isOpen = header.classList.toggle('nav-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
}

navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.forEach((item) => item.classList.toggle('active', item === link));

    if (header && header.classList.contains('nav-open')) {
      header.classList.remove('nav-open');
      if (navToggle) {
        navToggle.setAttribute('aria-expanded', 'false');
      }
    }
  });
});

const timelineItems = Array.from(document.querySelectorAll('.timeline-item'));

timelineItems.forEach((item) => {
  item.addEventListener('click', () => {
    timelineItems.forEach((candidate) => candidate.classList.toggle('active', candidate === item));
  });

  item.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      timelineItems.forEach((candidate) => candidate.classList.toggle('active', candidate === item));
    }
  });
});
