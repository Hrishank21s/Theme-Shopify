// Pool Club Theme JavaScript

class PoolClubTheme {
  constructor() {
    this.cart = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.initializeCart();
    this.setupProductVariants();
    this.initializeAnimations();
  }

  setupEventListeners() {
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mainNav = document.querySelector('.main-nav');
    
    if (mobileMenuBtn && mainNav) {
      mobileMenuBtn.addEventListener('click', () => {
        mainNav.classList.toggle('mobile-open');
      });
    }

    // Add to cart buttons
    document.addEventListener('click', (e) => {
      if (e.target.matches('.add-to-cart') || e.target.closest('.add-to-cart')) {
        e.preventDefault();
        this.handleAddToCart(e.target);
      }
    });

    // Quantity selectors
    document.addEventListener('click', (e) => {
      if (e.target.matches('.quantity-btn')) {
        this.handleQuantityChange(e.target);
      }
    });

    // Product variant changes
    document.addEventListener('change', (e) => {
      if (e.target.matches('.product-variant-select')) {
        this.handleVariantChange(e.target);
      }
    });
  }

  async initializeCart() {
    try {
      const response = await fetch('/cart.js');
      this.cart = await response.json();
      this.updateCartCount();
    } catch (error) {
      console.error('Failed to initialize cart:', error);
    }
  }

  async handleAddToCart(button) {
    const form = button.closest('form') || button.closest('.product-form');
    if (!form) return;

    const formData = new FormData(form);
    const buttonText = button.textContent;
    
    // Show loading state
    button.textContent = 'Adding...';
    button.disabled = true;

    try {
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const item = await response.json();
        this.showNotification('Added to cart!', 'success');
        this.updateCartCount();
        this.openCartDrawer();
      } else {
        const error = await response.json();
        this.showNotification(error.description || 'Failed to add to cart', 'error');
      }
    } catch (error) {
      this.showNotification('Network error. Please try again.', 'error');
    } finally {
      button.textContent = buttonText;
      button.disabled = false;
    }
  }

  handleQuantityChange(button) {
    const input = button.parentNode.querySelector('.quantity-input');
    const isIncrease = button.classList.contains('quantity-increase');
    let currentValue = parseInt(input.value) || 1;

    if (isIncrease) {
      currentValue++;
    } else {
      currentValue = Math.max(1, currentValue - 1);
    }

    input.value = currentValue;
    input.dispatchEvent(new Event('change'));
  }

  handleVariantChange(select) {
    const productForm = select.closest('.product-form');
    const priceElement = productForm.querySelector('.product-price');
    const addToCartBtn = productForm.querySelector('.add-to-cart');
    
    const selectedOption = select.selectedOptions[0];
    const price = selectedOption.dataset.price;
    const available = selectedOption.dataset.available === 'true';

    if (priceElement && price) {
      priceElement.textContent = this.formatMoney(price);
    }

    if (addToCartBtn) {
      if (available) {
        addToCartBtn.disabled = false;
        addToCartBtn.textContent = 'Add to Cart';
      } else {
        addToCartBtn.disabled = true;
        addToCartBtn.textContent = 'Sold Out';
      }
    }
  }

  updateCartCount() {
    const cartCountElements = document.querySelectorAll('.cart-count');
    const count = this.cart ? this.cart.item_count : 0;
    
    cartCountElements.forEach(element => {
      element.textContent = count;
      element.style.display = count > 0 ? 'flex' : 'none';
    });
  }

  openCartDrawer() {
    // Implementation for cart drawer if needed
    console.log('Opening cart drawer...');
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '15px 20px',
      background: type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3',
      color: 'white',
      borderRadius: '5px',
      zIndex: '1000',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      transform: 'translateX(100%)',
      transition: 'transform 0.3s ease'
    });
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  formatMoney(cents) {
    const amount = cents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  initializeAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    // Observe elements that should animate
    document.querySelectorAll('.product-card, .category-card, .section-title').forEach(el => {
      observer.observe(el);
    });
  }

  // Search functionality
  setupSearch() {
    const searchInput = document.querySelector('.search-input');
    const searchResults = document.querySelector('.search-results');
    
    if (!searchInput) return;

    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      const query = e.target.value.trim();
      
      if (query.length < 2) {
        this.hideSearchResults();
        return;
      }
      
      searchTimeout = setTimeout(() => {
        this.performSearch(query);
      }, 300);
    });
  }

  async performSearch(query) {
    try {
      const response = await fetch(`/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=5`);
      const data = await response.json();
      this.displaySearchResults(data.resources.results.products);
    } catch (error) {
      console.error('Search error:', error);
    }
  }

  displaySearchResults(products) {
    const searchResults = document.querySelector('.search-results');
    if (!searchResults) return;

    if (!products || products.length === 0) {
      searchResults.innerHTML = '<div class="no-results">No products found</div>';
      return;
    }

    const resultsHTML = products.map(product => `
      <div class="search-result-item">
        <img src="${product.featured_image}" alt="${product.title}" class="search-result-image">
        <div class="search-result-info">
          <h4>${product.title}</h4>
          <p class="search-result-price">${this.formatMoney(product.price)}</p>
        </div>
      </div>
    `).join('');

    searchResults.innerHTML = resultsHTML;
    searchResults.classList.add('visible');
  }

  hideSearchResults() {
    const searchResults = document.querySelector('.search-results');
    if (searchResults) {
      searchResults.classList.remove('visible');
    }
  }
}

// Initialize theme when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PoolClubTheme();
});

// Product image gallery
class ProductGallery {
  constructor(container) {
    this.container = container;
    this.mainImage = container.querySelector('.main-product-image');
    this.thumbnails = container.querySelectorAll('.product-thumbnail');
    this.init();
  }

  init() {
    this.thumbnails.forEach(thumb => {
      thumb.addEventListener('click', (e) => {
        e.preventDefault();
        this.changeMainImage(thumb.href, thumb.querySelector('img').alt);
        this.updateActiveThumbnail(thumb);
      });
    });
  }

  changeMainImage(src, alt) {
    if (this.mainImage) {
      this.mainImage.src = src;
      this.mainImage.alt = alt;
    }
  }

  updateActiveThumbnail(activeThumb) {
    this.thumbnails.forEach(thumb => thumb.classList.remove('active'));
    activeThumb.classList.add('active');
  }
}

// Initialize product galleries
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.product-gallery').forEach(gallery => {
    new ProductGallery(gallery);
  });
});

