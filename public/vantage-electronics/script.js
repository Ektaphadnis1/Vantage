// Product Database with Indian Prices and Images
const products = [
    { id: 1, name: "MacBook Pro 14\"", price: "₹1,69,900", priceValue: 169900, description: "M3 chip, 16GB RAM, 512GB SSD, Space Black", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop" },
    { id: 2, name: "MacBook Air 13\"", price: "₹1,14,900", priceValue: 114900, description: "M2 chip, 8GB RAM, 256GB SSD, Midnight", image: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=400&h=300&fit=crop" },
    { id: 3, name: "AirPods Pro 2", price: "₹24,900", priceValue: 24900, description: "Active Noise Cancellation, USB-C, Spatial Audio", image: "https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=400&h=300&fit=crop" },
    { id: 4, name: "AirPods Max", price: "₹59,900", priceValue: 59900, description: "Over-ear headphones, High-fidelity audio, 5 colors", image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=300&fit=crop" },
    { id: 5, name: "Apple Watch Ultra 2", price: "₹89,900", priceValue: 89900, description: "49mm titanium case, GPS + Cellular, 100m water resistance", image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&h=300&fit=crop" },
    { id: 6, name: "Apple Watch Series 9", price: "₹41,900", priceValue: 41900, description: "41mm, GPS, Always-On Retina display, S9 chip", image: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400&h=300&fit=crop" },
    { id: 7, name: "Magic Keyboard", price: "₹18,500", priceValue: 18500, description: "Full-size, Touch ID, Numeric keypad, Silver", image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=300&fit=crop" },
    { id: 8, name: "Magic Mouse", price: "₹8,500", priceValue: 8500, description: "Multi-Touch surface, Rechargeable, Silver", image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400&h=300&fit=crop" },
    { id: 9, name: "Studio Display 27\"", price: "₹1,59,900", priceValue: 159900, description: "5K Retina, Nano-texture glass, 12MP camera", image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=300&fit=crop" },
    { id: 10, name: "HomePod 2nd Gen", price: "₹32,900", priceValue: 32900, description: "High-fidelity audio, Smart speaker, Room-sensing", image: "https://images.unsplash.com/photo-1589003077984-894e133dabab?w=400&h=300&fit=crop" },
    { id: 11, name: "MagSafe Charger", price: "₹4,500", priceValue: 4500, description: "Wireless charging 15W, Fast charging", image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop" },
    { id: 12, name: "35W Dual USB-C Charger", price: "₹6,500", priceValue: 6500, description: "Compact design, Charge two devices simultaneously", image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=300&fit=crop" }
];

// Cart array
let cart = [];

// Load cart from localStorage
function loadCart() {
    const savedCart = localStorage.getItem('vantageCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
    updateCartUI();
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('vantageCart', JSON.stringify(cart));
    updateCartUI();
}

// Update cart count and display
function updateCartUI() {
    const cartCountElements = document.querySelectorAll('#cartCount');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountElements.forEach(el => {
        if (el) el.innerText = totalItems;
    });
    
    // Update cart modal if open
    const cartItemsDiv = document.getElementById('cartItems');
    if (cartItemsDiv && getComputedStyle(document.getElementById('cartModal')).display !== 'none') {
        displayCartItems();
    }
}

// Display cart items in modal
function displayCartItems() {
    const cartItemsDiv = document.getElementById('cartItems');
    const cartTotalSpan = document.getElementById('cartTotal');
    
    if (!cartItemsDiv) return;
    
    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<p style="text-align:center; color:#888;">Your cart is empty</p>';
        if (cartTotalSpan) cartTotalSpan.innerText = '₹0';
        return;
    }
    
    let total = 0;
    cartItemsDiv.innerHTML = '';
    
    cart.forEach((item, index) => {
        const itemTotal = item.priceValue * item.quantity;
        total += itemTotal;
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';
        itemDiv.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${item.price}</div>
            </div>
            <div class="cart-item-quantity">
                <button onclick="updateQuantity(${index}, -1)">-</button>
                <span>${item.quantity}</span>
                <button onclick="updateQuantity(${index}, 1)">+</button>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart(${index})">🗑️</button>
        `;
        cartItemsDiv.appendChild(itemDiv);
    });
    
    if (cartTotalSpan) {
        cartTotalSpan.innerText = '₹' + total.toLocaleString('en-IN');
    }
}

// Update quantity
function updateQuantity(index, change) {
    const newQuantity = cart[index].quantity + change;
    if (newQuantity <= 0) {
        cart.splice(index, 1);
    } else {
        cart[index].quantity = newQuantity;
    }
    saveCart();
    displayCartItems();
}

// Remove from cart
function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    displayCartItems();
}

// Add to cart
function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            priceValue: product.priceValue,
            quantity: 1
        });
    }
    
    saveCart();
    
    // Show feedback
    const btn = document.getElementById('addToCartBtn');
    if (btn) {
        const originalText = btn.innerText;
        btn.innerText = 'Added to Cart ✓';
        btn.style.background = '#00a050';
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.background = '#0070f0';
        }, 1000);
    }
}

// Display products on homepage
function displayProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.src='https://placehold.co/400x300/1a1a1a/0070f0?text=${encodeURIComponent(product.name)}'">
            </div>
            <h3 class="product-name">${product.name}</h3>
            <div class="product-price">${product.price}</div>
            <button class="detail-btn" data-id="${product.id}">View Details</button>
        `;
        grid.appendChild(card);
    });
    
    document.querySelectorAll('.detail-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            const product = products.find(p => p.id === id);
            
            fetch(`/event?type=product_view&product=${encodeURIComponent(product.name)}`)
                .catch(err => console.log("Tracking error:", err));
            
            window.location.href = `product.html?id=${id}`;
        });
    });
}

// Load product details
function loadProductDetails() {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('id'));
    const product = products.find(p => p.id === id);
    
    if (!product) {
        window.location.href = 'index.html';
        return;
    }
    
    const container = document.getElementById('productDetail');
    if (!container) return;
    
    container.innerHTML = `
        <div class="detail-image">
            <img src="${product.image}" alt="${product.name}" onerror="this.src='https://placehold.co/600x400/1a1a1a/0070f0?text=${encodeURIComponent(product.name)}'">
        </div>
        <h1 class="detail-name">${product.name}</h1>
        <div class="detail-price">${product.price}</div>
        <p class="detail-description">${product.description}</p>
        <button class="add-to-cart-btn" id="addToCartBtn">Add to Cart 🛒</button>
    `;
    
    document.getElementById('addToCartBtn')?.addEventListener('click', () => {
        fetch(`/event?type=add_to_cart&product=${encodeURIComponent(product.name)}&price=${product.priceValue}`)
            .catch(err => console.log("Tracking error:", err));
        addToCart(product);
    });
}

// Cart modal functions
function openCartModal() {
    const modal = document.getElementById('cartModal');
    if (modal) {
        displayCartItems();
        modal.style.display = 'block';
    }
}

function closeCartModal() {
    const modal = document.getElementById('cartModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function goBack() {
    window.location.href = 'index.html';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    
    if (window.location.pathname.includes('product.html')) {
        loadProductDetails();
    } else {
        displayProducts();
    }
    
    // Cart icon click
    const cartIcon = document.getElementById('cartIcon');
    if (cartIcon) {
        cartIcon.addEventListener('click', openCartModal);
    }
    
    // Modal close
    const closeBtn = document.querySelector('.cart-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeCartModal);
    }
    
    // Click outside modal to close
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('cartModal');
        if (e.target === modal) {
            closeCartModal();
        }
    });
    
    // Checkout button
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                alert('Your cart is empty!');
            } else {
                alert(`Order placed! Total: ₹${cart.reduce((sum, item) => sum + (item.priceValue * item.quantity), 0).toLocaleString('en-IN')}\nThank you for shopping at Vantage Electronics!`);
                cart = [];
                saveCart();
                closeCartModal();
            }
        });
    }
});