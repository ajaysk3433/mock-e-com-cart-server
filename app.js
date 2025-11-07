
const express = require('express');
const cors = require('cors');
const {Product, Cart} = require('./db');
const path = require('path');



const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'dist')));

// Get all products
app.get('/api/products', async (req, res) => {
    try {
        // const del = await Cart.deleteMany({});

        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Add item to cart
app.post('/api/cart', async (req, res) => {
    try {
        const { productId, qty } = req.body;

        // Validate product exists
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Check if item already in cart
        let cartItem = await Cart.findOne({ productId });

        if (cartItem) {
            // Update quantity if already exists
            cartItem.qty += qty;
            await cartItem.save();
        } else {

            // Create new cart item
            cartItem = await Cart.create({
                productId,
                qty,
                price: product.price,
                name: product.name,
                image : product.image
            });
        }

        res.json(cartItem);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add to cart' });
    }
});

// Remove item from cart
app.delete('/api/cart/:id', async (req, res) => {
    const productId = req.params.id;

    try {
        const cartItem = await Cart.findOneAndDelete({ productId });


        if (!cartItem) {
            return res.status(404).json({ error: 'Cart item not found' });
        }

        res.json({ message: 'Item removed from cart', cartItem });
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove item from cart' });
    }
});

// Get cart with total
app.get('/api/cart', async (req, res) => {

    try {
        const cartItems = await Cart.find().populate('productId');
        // console.log(cartItems)
        // Calculate total
        const total = cartItems.reduce((sum, item) => {
            return sum + (item.price * item.qty);
        }, 0);

        res.json({
            items: cartItems,
            total,
            itemCount: cartItems.length
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch cart' });
    }
});

// Checkout
app.post('/api/checkout', async (req, res) => {
    try {
        const { cartItems, customerInfo } = req.body;

        // Validate cart items
        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // Calculate total
        const total = cartItems.reduce((sum, item) => {
            return sum + (item.price * item.qty);
        }, 0);

        // Clear cart after successful checkout
        await Cart.deleteMany({});

        res.json({
            orderId: `ORD-${Date.now()}`,
            total,
            timestamp: new Date().toISOString(),
            customer: customerInfo,
            items: cartItems
        });
    } catch (error) {
        res.status(500).json({ error: 'Checkout failed' });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));