import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    image: {
      type: String,
      default: ''
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative']
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      default: 1
    }
  },
  {
    _id: false // Don't create separate _id for cart items
  }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true // One cart per user
    },
    items: [cartItemSchema],
    totalPrice: {
      type: Number,
      default: 0,
      min: [0, 'Total price cannot be negative']
    },
    totalItems: {
      type: Number,
      default: 0,
      min: [0, 'Total items cannot be negative']
    }
  },
  {
    timestamps: true
  }
);


cartSchema.index({ user: 1 });

cartSchema.methods.calculateTotals = function () {
  this.totalPrice = this.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  this.totalItems = this.items.reduce(
    (total, item) => total + item.quantity,
    0
  );
};


cartSchema.methods.addItem = async function (product, quantity = 1) {
  const Product = mongoose.model('Product');

  // Fetch product to get current details
  const productDoc = await Product.findById(product);
  if (!productDoc) {
    throw new Error('Product not found');
  }

  if (!productDoc.inStock) {
    throw new Error('Product is out of stock');
  }

  // Check if item already in cart
  const existingItemIndex = this.items.findIndex(
    (item) => item.product.toString() === product.toString()
  );

  if (existingItemIndex > -1) {
    // Update quantity (check stock availability)
    const newQuantity = this.items[existingItemIndex].quantity + quantity;
    if (newQuantity > productDoc.stock) {
      throw new Error(`Only ${productDoc.stock} items available in stock`);
    }
    this.items[existingItemIndex].quantity = newQuantity;
  } else {
    // Add new item with price snapshot
    this.items.push({
      product: product,
      name: productDoc.name,
      image: productDoc.images?.[0]?.url || '',
      price: productDoc.price,
      quantity
    });

  }

  // Recalculate totals
  this.calculateTotals();
  return this.save();
};

cartSchema.methods.removeItem = function (productId) {
  this.items = this.items.filter(
    (item) => item.product.toString() !== productId.toString()
  );
  this.calculateTotals();
  return this.save();
};


cartSchema.methods.updateItemQuantity = async function (productId, quantity) {
  const Product = mongoose.model('Product');

  if (quantity <= 0) {
    return this.removeItem(productId);
  }

  const item = this.items.find(
    (item) => item.product.toString() === productId.toString()
  );

  if (!item) {
    throw new Error('Item not found in cart');
  }

  // Check stock availability
  const productDoc = await Product.findById(productId);
  if (quantity > productDoc.stock) {
    throw new Error(`Only ${productDoc.stock} items available in stock`);
  }

  item.quantity = quantity;
  this.calculateTotals();
  return this.save();
};


cartSchema.methods.clearCart = function () {
  this.items = [];
  this.totalPrice = 0;
  this.totalItems = 0;
  return this.save();
};

cartSchema.statics.getOrCreateCart = async function (userId) {
  let cart = await this.findOne({ user: userId }).populate('items.product');

  if (!cart) {
    cart = await this.create({ user: userId });
  }

  return cart;
};

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;







