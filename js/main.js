// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Mobile nav toggle
const header = document.querySelector('.site-header');
const navToggle = document.getElementById('navToggle');
navToggle.addEventListener('click', () => {
  const isOpen = header.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});
document.querySelectorAll('.main-nav a').forEach(link => {
  link.addEventListener('click', () => {
    header.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// Scroll reveal for cards / steps / sections
const revealTargets = document.querySelectorAll('.card, .process-steps li, .job-ticket, .why-list li');
revealTargets.forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(14px)';
  el.style.transition = 'opacity .5s ease, transform .5s ease';
});

const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

revealTargets.forEach(el => io.observe(el));

// Contact form submission
const form = document.getElementById('contactForm');
const status = document.getElementById('formStatus');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Run the browser's own validation (email format, required fields) and
  // show its native "please fix this field" bubble if something's wrong.
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  status.textContent = 'Sending…';
  status.classList.remove('error');

  // Interface-only build: no backend is wired up, so there's nothing to
  // POST to. Simulate a short delay then show the same success state the
  // real form would show. Replace this block with a real fetch('/api/contact', ...)
  // once you have a server (or a service like Formspree) to send it to.
  setTimeout(() => {
    status.textContent = "Thanks — we've got your request and will be in touch shortly.";
    form.reset();
  }, 600);
});
