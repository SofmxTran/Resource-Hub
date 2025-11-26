// ============================================
// Main Client-Side JavaScript
// ============================================

// Initialize AOS (Animate On Scroll) when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Initialize AOS
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: true,
      offset: 100
    });
  }

  // Scroll to top button functionality
  const scrollToTopBtn = document.getElementById('scrollToTop');
  
  if (scrollToTopBtn) {
    // Show/hide scroll to top button
    window.addEventListener('scroll', function() {
      if (window.pageYOffset > 300) {
        scrollToTopBtn.classList.add('show');
      } else {
        scrollToTopBtn.classList.remove('show');
      }
    });

    // Smooth scroll to top on click
    scrollToTopBtn.addEventListener('click', function() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href !== '#' && href.length > 1) {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });

  // Mobile menu toggle enhancement (Bootstrap handles it, but we can add smooth transitions)
  const navbarToggler = document.querySelector('.navbar-toggler');
  const navbarCollapse = document.querySelector('.navbar-collapse');
  
  if (navbarToggler && navbarCollapse) {
    navbarToggler.addEventListener('click', function() {
      // Add a small delay for smooth animation
      setTimeout(() => {
        if (navbarCollapse.classList.contains('show')) {
          navbarCollapse.style.transition = 'all 0.3s ease';
        }
      }, 10);
    });
  }

  // Add fade-in animation to cards on page load
  const cards = document.querySelectorAll('.card');
  cards.forEach((card, index) => {
    if (!card.hasAttribute('data-aos')) {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      setTimeout(() => {
        card.style.transition = 'all 0.5s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, index * 50);
    }
  });

  // Form validation enhancement (visual feedback)
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
      let isValid = true;
      
      inputs.forEach(input => {
        if (!input.value.trim()) {
          isValid = false;
          input.classList.add('is-invalid');
          setTimeout(() => {
            input.classList.remove('is-invalid');
          }, 3000);
        } else {
          input.classList.remove('is-invalid');
        }
      });

      if (!isValid) {
        e.preventDefault();
      }
    });
  });

  // Add loading state to buttons on form submit
  const submitButtons = document.querySelectorAll('form button[type="submit"]');
  submitButtons.forEach(button => {
    button.closest('form').addEventListener('submit', function() {
      button.disabled = true;
      button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
    });
  });
});

// Utility function for smooth page transitions (if needed)
function fadeIn(element) {
  element.style.opacity = '0';
  element.style.transition = 'opacity 0.5s ease';
  setTimeout(() => {
    element.style.opacity = '1';
  }, 10);
}

