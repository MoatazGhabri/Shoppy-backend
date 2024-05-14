const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const port = 5000;
app.use(cors());
app.use(express.json());
app.use(bodyParser.json({ limit: '100mb' }));
const stripe = require('stripe')('sk_test_51OcUWuDKj1JsPJWQJyis57td15SN2ZO7YToGwwTF4mEHnlZrTjV55N66BoMtQpakcQA7geRvquW9qrEbEsZ46by80033faTSAp');

const mongoURI = 'mongodb+srv://Moatez:ghabriGH95@shop.nvwoesu.mongodb.net/Shop?retryWrites=true&w=majority';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('Error connecting to MongoDB Atlas:', err));


const productSchema = new mongoose.Schema({
    name: String,
    price: Number,
    quantity: Number,
    image: String,
    category: String,
    sizes:[String],
  });
  
  const Product = mongoose.model("Product", productSchema);
  
  
  app.get("/api/products", async (req, res) => {
    try {
    const products = await Product.find();

    //const products = await Product.find({}, { _id: 0, name: 1, price: 1, image: 1 })
      res.json(products);
    } catch (error) {
      console.error("Failed to fetch products:", error); 
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });
  app.get("/api/product", async (req, res) => {
    try {
      const category = req.query.category; 
      const products = await Product.find({ category }); 
  
      res.json(products);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });
  
  app.post("/api/products", async (req, res) => {
    try {
      const { name, price, quantity, image,category, sizes } = req.body;
  
      const newProduct = new Product({
        name,
        price,
        quantity,
        image,
        category,
        sizes,
      });
  
      await newProduct.save();
  
      res.status(201).json({ message: "Product created successfully", product: newProduct });
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ error: "Failed to create product", detail: error.message });
    }
  });
  app.delete("/api/products/:id", async (req, res) => {
    const productId = req.params.id;
    try {
      const deletedProduct = await Product.findByIdAndDelete(productId);
      if (!deletedProduct) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(deletedProduct);
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });
  app.put("/api/products/:id", async (req, res) => {
    const productId = req.params.id; // Corrected to req.params.id
    const { name, price, quantity, image, category } = req.body;
    try {
      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        { name, price, quantity, image, category }, 
        { new: true }
      );
      if (!updatedProduct) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(updatedProduct);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ error: "Failed to update product" });
    }
  });
  
  // Orders 
  const orderSchema = new mongoose.Schema({
    userId: String, 

    productName: String,
    price: Number,
    quantity: Number,
    image: String,
    category:String,
  });
  
  const Order = mongoose.model("Order", orderSchema);
  app.get("/api/orders", async (req, res) => {
    try {
      const userId = req.query.userId;
      const orders = await Order.find({ userId }); 
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });
  

  app.post("/api/orders", async (req, res) => {
    try {
      const {userId, productName, price, quantity, image,category } = req.body;
      const newOrder = new Order({
        userId,

        productName,
        price,
        quantity,
        image,
        category,
      });
      await newOrder.save();
      res.status(201).json(newOrder);
    } catch (error) {
      res.status(500).json({ error: "Failed to create order" });
    }
  });
  app.delete("/api/orders/:id", async (req, res) => {
    const orderId = req.params.id;
    try {
      const deletedOrder = await Order.findByIdAndDelete(orderId);
      if (!deletedOrder) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(deletedOrder);
    } catch (error) {
      res.status(500).json({ error: "Failed to delete order" });
    }
  });
  
  const commandeSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
    },
    email: {
      type: String,
      required: true,
    },
    address: {
      type: String,
    },
    number: {
      type: String,
    },
    quantity: {
      type: Number,
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
    },
    category: {
        type: String,
        required: true,
      },
    sessionId:String,

  });
  
  const Commande = mongoose.model("Commande", commandeSchema);
  
  app.post("/api/commande", async (req, res) => {
    try {
      const { name, lastName, email, address, number, quantity, productName, image, price, sessionId, category } = req.body;
  
      const product = await Product.findOne({ name: productName });
  
      if (!product || product.quantity < quantity) {
        return res.status(400).json({ error: "Product not found or out of stock" });
      }
  
      product.quantity -= quantity;
      await product.save();
  
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Order',
              },
              unit_amount: price * 100, 
            },
            quantity,
          },
        ],
        mode: 'payment',
        success_url: 'http://localhost:3000/',
        cancel_url: 'http://localhost:3000/',
      });
  
      res.status(200).json({ sessionId: session.id });
  
      const newCommande = new Commande({
        name,
        lastName,
        email,
        address,
        number,
        quantity,
        productName,
        image,
        price,
        category,
        sessionId,
      });
  
      await newCommande.save();
  
      const deletedOrder = await Order.findOneAndDelete({ productName });
  
    } catch (error) {
      console.error("Error creating commande:", error);
      res.status(500).json({ error: "Failed to create commande" });
    }
  });
  
  
  app.get('/api/commande', async (req, res) => {
    try {
      const commande = await Commande.find();
      res.json(commande);
    } catch (error) {
      console.error('Error fetching commande:', error);
      res.status(500).json({ error: 'Failed to fetch commande' });
    }
  });
  
  const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
  });
  
  const User = mongoose.model("User", userSchema);
  
  app.post("/api/users", async (req, res) => {
    try {
      const { name, lastName, email, password } = req.body;
  
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }
    const newUser = new User({ name, lastName, email, password });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const user = await User.findOne({ email });
  
      // If user not found or password is incorrect, return error
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
  
      // If authentication is successful, return user information
      res.status(200).json({
        _id: user._id,
        name: user.name,
        lastName: user.lastName,
        email: user.email
        // Add any other user information you want to return
      });
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  app.get('/api/users', async (req, res) => {
    try {
      const users = await User.find();
      res.status(200).json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
      const deletedUser = await User.findByIdAndDelete(id);
      if (!deletedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      console.log('User deleted successfully:', deletedUser);
      res.status(200).json({ message: 'User deleted successfully!' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const {  name ,email, lastName } = req.body;
    
    try {
      const updatedUser = await User.findByIdAndUpdate(id, { name ,email, lastName}, { new: true });
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      console.log('User updated successfully:', updatedUser);
      res.status(200).json({ message: 'User updated successfully!', user: updatedUser });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  const AdminsSchema = new mongoose.Schema({
    username: String,
    password: String 
  });
  const Admins = mongoose.model('Admins', AdminsSchema);

  app.get('/api/Admins', async (req, res) => {
    try {
      const admins = await Admins.find();
      res.status(200).json(admins);
    } catch (error) {
      console.error('Error fetching admins:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
  
    try {
      const admin = await Admins.findOne({ username });
  
      if (!admin || admin.password !== password) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
  
      res.status(200).json({
        _id: admin._id,
        username: admin.username,
      });
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
