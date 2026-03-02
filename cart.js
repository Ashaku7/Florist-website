// Cart Management
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// DOM Elements
const cartIcon = document.getElementById('cartIcon');
const cartSidebar = document.getElementById('cartSidebar');
const closeCartBtn = document.getElementById('closeCart');
const cartItemsContainer = document.getElementById('cartItems');
const cartCountBadge = document.getElementById('cartCount');
const cartTotalElement = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');
const checkoutModal = document.getElementById('checkoutModal');
const closeModalBtn = document.getElementById('closeModal');
const checkoutForm = document.getElementById('checkoutForm');

// Add to cart functionality
document.querySelectorAll('.btn-add-cart').forEach(button => {
    button.addEventListener('click', function() {
        const productName = this.getAttribute('data-product');
        const price = parseInt(this.getAttribute('data-price'));
        addToCart(productName, price);
        showNotification(`${productName} added to cart!`);
    });
});

// Buy Now functionality - adds item to cart and opens checkout directly
document.querySelectorAll('.btn-buy-now').forEach(button => {
    button.addEventListener('click', function() {
        const productName = this.getAttribute('data-product');
        const price = parseInt(this.getAttribute('data-price'));
        
        // Add to cart first
        addToCart(productName, price);
        showNotification(`${productName} added! Opening checkout...`);
        
        // Open cart sidebar
        cartSidebar.classList.add('open');
        
        // Open checkout modal after a short delay
        setTimeout(() => {
            openCheckoutModal();
        }, 500);
    });
});

// Add product to cart
function addToCart(productName, price) {
    const existingItem = cart.find(item => item.name === productName);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: Date.now(),
            name: productName,
            price: price,
            quantity: 1
        });
    }
    
    saveCart();
    updateCartUI();
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Update cart UI
function updateCartUI() {
    updateCartCount();
    updateCartItems();
    updateCartTotal();
}

// Update cart count badge
function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountBadge.textContent = totalItems;
}

// Update cart items display
function updateCartItems() {
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        checkoutBtn.disabled = true;
        return;
    }
    
    checkoutBtn.disabled = false;
    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">₹${item.price}</div>
            </div>
            <div class="cart-item-quantity">
                <button onclick="decreaseQuantity(${item.id})">−</button>
                <span>${item.quantity}</span>
                <button onclick="increaseQuantity(${item.id})">+</button>
            </div>
            <button class="remove-item" onclick="removeFromCart(${item.id})">Remove</button>
        </div>
    `).join('');
}

// Update cart total
function updateCartTotal() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotalElement.textContent = `₹${total}`;
}

// Increase item quantity
function increaseQuantity(itemId) {
    const item = cart.find(i => i.id === itemId);
    if (item) {
        item.quantity++;
        saveCart();
        updateCartUI();
    }
}

// Decrease item quantity
function decreaseQuantity(itemId) {
    const item = cart.find(i => i.id === itemId);
    if (item) {
        if (item.quantity > 1) {
            item.quantity--;
        } else {
            removeFromCart(itemId);
        }
        saveCart();
        updateCartUI();
    }
}

// Remove item from cart
function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    saveCart();
    updateCartUI();
}

// Toggle cart sidebar
cartIcon.addEventListener('click', function(e) {
    e.preventDefault();
    cartSidebar.classList.toggle('open');
});

// Close cart sidebar
closeCartBtn.addEventListener('click', function() {
    cartSidebar.classList.remove('open');
});

// Close cart when clicking outside
document.addEventListener('click', function(e) {
    if (!cartSidebar.contains(e.target) && !cartIcon.contains(e.target)) {
        cartSidebar.classList.remove('open');
    }
});

// Checkout button
checkoutBtn.addEventListener('click', function() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    openCheckoutModal();
});

// Open checkout modal
function openCheckoutModal() {
    checkoutModal.classList.add('open');
    updateOrderSummary();
}

// Close checkout modal
closeModalBtn.addEventListener('click', function() {
    checkoutModal.classList.remove('open');
});

// Close modal when clicking outside
checkoutModal.addEventListener('click', function(e) {
    if (e.target === this) {
        this.classList.remove('open');
    }
});

// Update order summary in checkout
function updateOrderSummary() {
    const orderItemsDiv = document.getElementById('orderItems');
    const modalTotal = document.getElementById('modalTotal');
    
    let total = 0;
    orderItemsDiv.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        return `
            <div class="summary-item">
                <span>${item.name} x${item.quantity}</span>
                <span>₹${itemTotal}</span>
            </div>
        `;
    }).join('');
    
    modalTotal.textContent = `₹${total}`;
}

// Handle checkout form submission
checkoutForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const customerName = document.getElementById('customerName').value;
    const customerEmail = document.getElementById('customerEmail').value;
    const customerPhone = document.getElementById('customerPhone').value;
    const customerAddress = document.getElementById('customerAddress').value;
    const deliveryDate = document.getElementById('deliveryDate').value;
    const specialNotes = document.getElementById('specialNotes').value;
    
    // Calculate total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Prepare order data
    const orderData = {
        orderId: 'ORD-' + Date.now(),
        customer: {
            name: customerName,
            email: customerEmail,
            phone: customerPhone,
            address: customerAddress
        },
        items: cart,
        total: total,
        deliveryDate: deliveryDate,
        notes: specialNotes,
        orderDate: new Date().toLocaleString(),
        status: 'Pending'
    };
    
    // Save order to localStorage
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders.push(orderData);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Show success message
    showNotification('Order placed successfully! Order ID: ' + orderData.orderId);
    
    // Send WhatsApp message
    sendOrderWhatsApp(orderData);
    
    // Clear cart
    cart = [];
    saveCart();
    updateCartUI();
    
    // Close modal and cart
    checkoutModal.classList.remove('open');
    cartSidebar.classList.remove('open');
    
    // Reset form
    checkoutForm.reset();
});

// Send order via WhatsApp
function sendOrderWhatsApp(orderData) {
    const message = `Order Confirmation%0A%0AOrder ID: ${orderData.orderId}%0ACustomer: ${orderData.customer.name}%0APhone: ${orderData.customer.phone}%0AAddress: ${orderData.customer.address}%0ADelivery Date: ${orderData.deliveryDate}%0A%0AItems:%0A${orderData.items.map(item => `${item.name} x${item.quantity} = ₹${item.price * item.quantity}`).join('%0A')}%0A%0ATotal: ₹${orderData.total}%0ASpecial Notes: ${orderData.notes || 'None'}`;
    
    // Open WhatsApp with message
    window.open(`https://wa.me/919841008008?text=${message}`, '_blank');
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4caf50;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 2000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Initialize cart on page load
window.addEventListener('load', function() {
    updateCartUI();
});

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
