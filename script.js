/* ==========================================================================
   INDOOR ROOTS – CLIENT-SIDE LOGIC & INTERACTION
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------------------------
    // 1. STATE & CONSTANTS
    // ----------------------------------------------------------------------
    let cart = JSON.parse(localStorage.getItem('indoor_roots_cart')) || [];
    
    // Store gallery items for lightbox navigation
    const galleryItemsData = [];
    const galleryElements = document.querySelectorAll('.gallery-item');
    galleryElements.forEach((el, index) => {
        const img = el.querySelector('img');
        const overlay = el.querySelector('.gallery-overlay');
        const cat = overlay.querySelector('.gallery-cat').textContent;
        const title = overlay.querySelector('h4').textContent;
        
        galleryItemsData.push({
            src: img.getAttribute('src'),
            cat: cat,
            title: title,
            categoryType: el.getAttribute('data-category')
        });
        
        // Save the index on the element for easy reference later
        el.setAttribute('data-index', index);
    });
    
    let activeLightboxIndex = 0;

    // SVG paths representing various organic leaves for the floating background animation
    const leafSvgPaths = [
        "M12 2C6.5 2 2 6.5 2 12c0 3 1.5 5.5 4 7.5l-2 2.5 4.5-1c1 .5 2.5 1 3.5 1 5.5 0 10-4.5 10-10S17.5 2 12 2zm-1 15c-2.5 0-4.5-2-4.5-4.5S8.5 8 11 8c1.5 0 2.5.5 3 1-.5.5-1.5 1.5-1.5 2.5S13.5 13 14 13.5c-.5.5-1.5 1.5-3 1.5z",
        "M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.58,20C9,20.67 11.67,20 14,18C18.67,14 20,8 20,8H17",
        "M12,2a10,10,0,0,0-10,10c0,5.25,7,10,10,10s10-4.75,10-10A10,10,0,0,0,12,2Z"
    ];

    // ----------------------------------------------------------------------
    // 2. STICKY NAVBAR & MOBILE DRAWER
    // ----------------------------------------------------------------------
    const header = document.querySelector('.navbar-header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const mobileDrawer = document.getElementById('mobile-drawer');
    const openIcon = mobileToggle.querySelector('.menu-open-icon');
    const closeIcon = mobileToggle.querySelector('.menu-close-icon');

    function toggleMobileMenu() {
        const isOpen = mobileDrawer.classList.toggle('open');
        openIcon.classList.toggle('hidden', isOpen);
        closeIcon.classList.toggle('hidden', !isOpen);
    }

    mobileToggle.addEventListener('click', toggleMobileMenu);

    // ----------------------------------------------------------------------
    // 3. SPA ROUTER
    // ----------------------------------------------------------------------
    const navLinks = document.querySelectorAll('.menu-link');
    const mobileLinks = document.querySelectorAll('.mobile-link');
    const pages = document.querySelectorAll('.page-view');

    function navigateToPage(pageId) {
        // Deactivate all sections and links
        pages.forEach(page => page.classList.remove('active'));
        navLinks.forEach(link => link.classList.remove('active'));
        mobileLinks.forEach(link => link.classList.remove('active'));

        // Activate target section
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
            
            // Highlight active nav item (Desktop & Mobile)
            const activeDesktopLink = document.querySelector(`.menu-link[data-page="${pageId}"]`);
            if (activeDesktopLink) activeDesktopLink.classList.add('active');
            
            const activeMobileLink = document.querySelector(`.mobile-link[data-page="${pageId}"]`);
            if (activeMobileLink) activeMobileLink.classList.add('active');

            // Scroll smoothly back to top of page
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    function handleRouting() {
        const hash = window.location.hash.substring(1) || 'home';
        navigateToPage(hash);
        
        // Auto-close mobile drawer on link navigation
        if (mobileDrawer.classList.contains('open')) {
            toggleMobileMenu();
        }
    }

    window.addEventListener('hashchange', handleRouting);
    // Initialize route on load
    handleRouting();

    // ----------------------------------------------------------------------
    // 4. FLOATING LEAVES BACKGROUND
    // ----------------------------------------------------------------------
    const leavesContainer = document.getElementById('leaves-container');
    const maxLeavesCount = 15;

    function spawnLeaf() {
        if (document.hidden) return; // Optimize CPU load when page backgrounded
        const leavesCount = leavesContainer.querySelectorAll('.floating-leaf').length;
        if (leavesCount >= maxLeavesCount) return;

        const leaf = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        leaf.setAttribute('viewBox', '0 0 24 24');
        leaf.classList.add('floating-leaf');
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const randomPath = leafSvgPaths[Math.floor(Math.random() * leafSvgPaths.length)];
        path.setAttribute('d', randomPath);
        leaf.appendChild(path);

        // Styling variants
        const size = Math.random() * 20 + 15; // 15px to 35px
        const left = Math.random() * 100; // 0% to 100% width
        const duration = Math.random() * 10 + 12; // 12s to 22s
        const delay = Math.random() * 5; // 0s to 5s delay

        leaf.style.width = `${size}px`;
        leaf.style.height = `${size}px`;
        leaf.style.left = `${left}%`;
        leaf.style.bottom = `-50px`; // Spawn just below viewport
        leaf.style.animationDuration = `${duration}s`;
        leaf.style.animationDelay = `${delay}s`;
        
        // Random green tint variations
        const greenTints = ['#5D7A4E', '#A8C686', '#D8E6C2', '#769466'];
        leaf.style.fill = greenTints[Math.floor(Math.random() * greenTints.length)];

        leavesContainer.appendChild(leaf);

        // Remove leaf after animation completes
        setTimeout(() => {
            leaf.remove();
        }, (duration + delay) * 1000);
    }

    // Set interval to spawn leaves continuously
    setInterval(spawnLeaf, 1500);
    // Initial batch
    for(let i=0; i<8; i++) {
        setTimeout(spawnLeaf, i * 400);
    }

    // ----------------------------------------------------------------------
    // 5. INTERACTIVE SHOPPING CART STATE & RENDER
    // ----------------------------------------------------------------------
    const cartToggle = document.getElementById('cart-toggle-btn');
    const cartDrawer = document.getElementById('cart-drawer');
    const cartClose = document.getElementById('cart-close-btn');
    const cartOverlay = cartDrawer.querySelector('.cart-drawer-overlay');
    const cartItemsWrapper = document.getElementById('cart-items-wrapper');
    const cartBadge = document.querySelector('.cart-badge');
    const cartTitleCount = document.querySelector('.cart-count-title');
    const subtotalText = document.querySelector('.subtotal-val');
    const gstText = document.querySelector('.gst-val');
    const totalText = document.querySelector('.total-val');
    const checkoutBtn = document.getElementById('checkout-btn');

    function toggleCartDrawer() {
        cartDrawer.classList.toggle('open');
    }

    cartToggle.addEventListener('click', toggleCartDrawer);
    cartClose.addEventListener('click', toggleCartDrawer);
    cartOverlay.addEventListener('click', toggleCartDrawer);

    // Close cart drawer if user clicks links inside empty state
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('close-cart-link')) {
            toggleCartDrawer();
        }
    });

    function showToast(message) {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast-msg';
        toast.innerHTML = `<span>🌿</span> ${message}`;
        toastContainer.appendChild(toast);
        
        // Trigger transition
        setTimeout(() => toast.classList.add('show'), 50);
        
        // Remove toast
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    function renderCart() {
        localStorage.setItem('indoor_roots_cart', JSON.stringify(cart));
        
        // Update badge counts
        const totalItemsCount = cart.reduce((sum, item) => sum + item.qty, 0);
        cartBadge.textContent = totalItemsCount;
        cartTitleCount.textContent = `${totalItemsCount} ${totalItemsCount === 1 ? 'item' : 'items'}`;
        
        if (cart.length === 0) {
            cartItemsWrapper.innerHTML = `
                <div class="empty-cart-state">
                    <div class="empty-cart-icon">🛒</div>
                    <p>Your shopping cart is empty.</p>
                    <a href="#plants" class="btn btn-primary btn-sm close-cart-link">Shop Plants</a>
                </div>
            `;
            subtotalText.textContent = '₹0';
            gstText.textContent = '₹0';
            totalText.textContent = '₹0';
            checkoutBtn.disabled = true;
            return;
        }

        // Render products
        cartItemsWrapper.innerHTML = '';
        let subtotal = 0;
        
        cart.forEach(item => {
            subtotal += item.price * item.qty;
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
                <img src="${item.img}" alt="${item.name}" class="cart-item-img">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <span class="cart-item-price">₹${item.price}</span>
                </div>
                <div class="cart-item-actions">
                    <div class="qty-controls">
                        <button class="qty-btn dec-btn" data-id="${item.id}">&minus;</button>
                        <span class="qty-val">${item.qty}</span>
                        <button class="qty-btn inc-btn" data-id="${item.id}">&plus;</button>
                    </div>
                    <button class="remove-item-btn" data-id="${item.id}">Remove</button>
                </div>
            `;
            cartItemsWrapper.appendChild(itemElement);
        });

        // Price calculations
        const gst = Math.round(subtotal * 0.18);
        const total = subtotal + gst;

        subtotalText.textContent = `₹${subtotal}`;
        gstText.textContent = `₹${gst}`;
        totalText.textContent = `₹${total}`;
        checkoutBtn.disabled = false;
    }

    function addToCart(id, name, price, img) {
        const parsedPrice = parseInt(price);
        const existingItem = cart.find(item => item.id === id);
        
        if (existingItem) {
            existingItem.qty += 1;
        } else {
            cart.push({
                id: id,
                name: name,
                price: parsedPrice,
                img: img,
                qty: 1
            });
        }
        
        renderCart();
        showToast(`${name} added to your cart.`);
    }

    function updateQty(id, change) {
        const itemIndex = cart.findIndex(item => item.id === id);
        if (itemIndex === -1) return;

        cart[itemIndex].qty += change;
        if (cart[itemIndex].qty <= 0) {
            cart.splice(itemIndex, 1);
        }
        renderCart();
    }

    function removeFromCart(id) {
        cart = cart.filter(item => item.id !== id);
        renderCart();
    }

    // Add to cart buttons listeners
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart-btn')) {
            const card = e.target.closest('.product-card');
            const id = card.getAttribute('data-product-id');
            const name = card.getAttribute('data-product-name');
            const price = card.getAttribute('data-product-price');
            const img = card.getAttribute('data-product-img');
            addToCart(id, name, price, img);
        }
    });

    // Cart actions inside drawer (+ / - / remove)
    cartItemsWrapper.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        if (!id) return;

        if (e.target.classList.contains('inc-btn')) {
            updateQty(id, 1);
        } else if (e.target.classList.contains('dec-btn')) {
            updateQty(id, -1);
        } else if (e.target.classList.contains('remove-item-btn')) {
            removeFromCart(id);
            showToast("Item removed from cart.");
        }
    });

    // Checkout Button Simulation
    checkoutBtn.addEventListener('click', () => {
        checkoutBtn.disabled = true;
        checkoutBtn.textContent = 'Processing...';
        
        setTimeout(() => {
            showToast("Order placed successfully! Thank you for choosing Indoor Roots.");
            cart = [];
            renderCart();
            toggleCartDrawer();
            checkoutBtn.textContent = 'Proceed to Checkout';
        }, 1500);
    });

    // Initial cart load
    renderCart();

    // ----------------------------------------------------------------------
    // 6. GALLERY CATEGORY FILTERS & LIGHTBOX
    // ----------------------------------------------------------------------
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active style from filters
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filterValue = btn.getAttribute('data-filter');
            
            galleryElements.forEach(item => {
                const category = item.getAttribute('data-category');
                
                if (filterValue === 'all' || category === filterValue) {
                    item.style.display = 'block';
                    // Reset fade in animation
                    item.style.animation = 'none';
                    item.offsetHeight; // trigger reflow
                    item.style.animation = 'fadeIn 0.5s ease forwards';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });

    // Lightbox Functionality
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCat = lightbox.querySelector('.lightbox-cat');
    const lightboxTitle = lightbox.querySelector('.lightbox-title');
    const lightboxClose = lightbox.querySelector('.lightbox-close-btn');
    const lightboxOverlay = lightbox.querySelector('.lightbox-overlay');
    const prevBtn = lightbox.querySelector('.prev-btn');
    const nextBtn = lightbox.querySelector('.next-btn');

    function openLightbox(index) {
        activeLightboxIndex = index;
        const data = galleryItemsData[index];
        
        lightboxImg.setAttribute('src', data.src);
        lightboxCat.textContent = data.cat;
        lightboxTitle.textContent = data.title;
        
        lightbox.classList.add('open');
    }

    function closeLightbox() {
        lightbox.classList.remove('open');
    }

    function navigateLightbox(direction) {
        let newIndex = activeLightboxIndex + direction;
        
        // Loop back
        if (newIndex < 0) {
            newIndex = galleryItemsData.length - 1;
        } else if (newIndex >= galleryItemsData.length) {
            newIndex = 0;
        }
        
        openLightbox(newIndex);
    }

    galleryElements.forEach(el => {
        el.addEventListener('click', () => {
            const index = parseInt(el.getAttribute('data-index'));
            openLightbox(index);
        });
    });

    lightboxClose.addEventListener('click', closeLightbox);
    lightboxOverlay.addEventListener('click', closeLightbox);
    prevBtn.addEventListener('click', () => navigateLightbox(-1));
    nextBtn.addEventListener('click', () => navigateLightbox(1));

    // Keyboard support for Lightbox (Left / Right / Esc)
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('open')) return;
        
        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowLeft') {
            navigateLightbox(-1);
        } else if (e.key === 'ArrowRight') {
            navigateLightbox(1);
        }
    });

    // ----------------------------------------------------------------------
    // 7. PLANTS PAGE CARE TIPS ACCORDION/TABS
    // ----------------------------------------------------------------------
    const careTabBtns = document.querySelectorAll('.care-tab-btn');
    const careTabContents = document.querySelectorAll('.care-tab-content');

    careTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            
            // Reset buttons
            careTabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Reset contents
            careTabContents.forEach(content => {
                content.classList.remove('active');
                if (content.getAttribute('id') === targetTab) {
                    content.classList.add('active');
                }
            });
        });
    });

    // ----------------------------------------------------------------------
    // 8. ABOUT PAGE INTERSECTION OBSERVER FOR STATS COUNTER
    // ----------------------------------------------------------------------
    const statNumbers = document.querySelectorAll('.stat-number');
    const statsSection = document.querySelector('.stats-grid');
    let countersRun = false;

    function runCounters() {
        statNumbers.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-target'));
            let count = 0;
            const speed = 2000 / target; // complete in 2 seconds
            
            const updateCount = () => {
                count += Math.ceil(target / 50); // Increment chunk
                if (count >= target) {
                    stat.textContent = target;
                } else {
                    stat.textContent = count;
                    setTimeout(updateCount, speed);
                }
            };
            
            updateCount();
        });
    }

    if (statsSection && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !countersRun) {
                    countersRun = true;
                    runCounters();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });
        
        observer.observe(statsSection);
    } else {
        // Fallback if IntersectionObserver is not supported
        runCounters();
    }

    // ----------------------------------------------------------------------
    // 9. CONTACT US FORM VALIDATIONS & SUCCESS FLOW
    // ----------------------------------------------------------------------
    const contactForm = document.getElementById('contact-form');
    const formSuccessAlert = document.getElementById('form-success-alert');
    const resetFormBtn = document.getElementById('reset-form-btn');
    const submitBtn = contactForm ? contactForm.querySelector('.submit-btn') : null;
    const btnText = submitBtn ? submitBtn.querySelector('.btn-text') : null;
    const btnSpinner = submitBtn ? submitBtn.querySelector('.btn-spinner') : null;

    function validateField(inputElement) {
        const group = inputElement.closest('.form-group');
        let isValid = true;

        if (inputElement.hasAttribute('required') && !inputElement.value.trim()) {
            isValid = false;
        } else if (inputElement.getAttribute('type') === 'email' && inputElement.value.trim()) {
            // Basic email validation regex
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            isValid = emailRegex.test(inputElement.value.trim());
        } else if (inputElement.getAttribute('type') === 'tel' && inputElement.value.trim()) {
            // Optional phone number validation (10 digits)
            const phoneRegex = /^\d{10}$/;
            isValid = phoneRegex.test(inputElement.value.replace(/[^0-9]/g, ''));
        }

        if (isValid) {
            group.classList.remove('invalid');
        } else {
            group.classList.add('invalid');
        }

        return isValid;
    }

    if (contactForm) {
        const inputs = contactForm.querySelectorAll('input, textarea');
        
        // Validate inputs on blur/input change
        inputs.forEach(input => {
            input.addEventListener('blur', () => validateField(input));
            input.addEventListener('input', () => {
                if (input.closest('.form-group').classList.contains('invalid')) {
                    validateField(input);
                }
            });
        });

        // Form Submit Handler
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            let formValid = true;
            inputs.forEach(input => {
                const isThisValid = validateField(input);
                if (!isThisValid) {
                    formValid = false;
                }
            });

            if (formValid) {
                const name = document.getElementById('form-name').value.trim();
                const email = document.getElementById('form-email').value.trim();
                const phone = document.getElementById('form-phone').value.trim() || 'Not provided';
                const message = document.getElementById('form-message').value.trim();

                const waMessage = `🌿 New Customer Inquiry\n\n👤 Name: ${name}\n📧 Email: ${email}\n📱 Phone: ${phone}\n\n🛒 Product Interested In:\n${message}\n\n💰 Please share:\n• Product Details\n• Price\n• Availability\n• Delivery Information`;
                
                const WA_NUMBER = "916303912534";
                const waUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waMessage)}`;

                // Open WhatsApp in a new tab
                window.open(waUrl, '_blank');
                
                // Clear the form and remove any validation styling
                contactForm.reset();
                inputs.forEach(i => i.closest('.form-group').classList.remove('invalid'));
                
                // Show success message and hide form
                contactForm.classList.add('hidden');
                formSuccessAlert.classList.remove('hidden');
            }
        });

        // Reset form to write another message
        if (resetFormBtn) {
            resetFormBtn.addEventListener('click', () => {
                formSuccessAlert.classList.add('hidden');
                contactForm.classList.remove('hidden');
            });
        }
    }

    // ----------------------------------------------------------------------
    // 9. AUTOMATIC REVIEWS SLIDER
    // ----------------------------------------------------------------------
    if (document.querySelector('.reviews-swiper')) {
        const swiper = new Swiper('.reviews-swiper', {
            slidesPerView: 1,
            spaceBetween: 30,
            loop: true,
            autoplay: {
                delay: 3000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
            },
            speed: 800,
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            breakpoints: {
                768: {
                    slidesPerView: 2,
                    spaceBetween: 30,
                },
                1024: {
                    slidesPerView: 3,
                    spaceBetween: 30,
                },
            },
        });
    }

    // ----------------------------------------------------------------------
    // 10. WHATSAPP BUY NOW BUTTON LOGIC
    // ----------------------------------------------------------------------
    const buyNowBtns = document.querySelectorAll('.buy-now-btn');
    const WA_NUMBER = "916303912534";

    buyNowBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            if (!card) return;

            const productName = card.getAttribute('data-product-name') || "Product";
            const productPrice = card.getAttribute('data-product-price') || "0";
            
            let category = "Product";
            const section = card.closest('section');
            if (section && section.id === 'miniatures') {
                category = "Miniature Toy";
            } else if (section && section.id === 'plants') {
                category = "Plant";
            }

            const message = `Hi, I'm interested in buying the following product:\n\nProduct: ${productName}\nPrice: ₹${productPrice}\nCategory: ${category}\nQuantity: 1`;
            
            const encodedMessage = encodeURIComponent(message);
            const waUrl = `https://wa.me/${WA_NUMBER}?text=${encodedMessage}`;
            
            window.open(waUrl, '_blank');
        });
    });
});
