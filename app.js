const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin:["https://shoppy-mty2.onrender.com"]
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  quantity: Number,
  image: String,
});

const Product = mongoose.model("Product", productSchema);

const orderSchema = new mongoose.Schema({
  productName: String,
  price: Number,
  quantity: Number,
  image: String,
});

const Order = mongoose.model("Order", orderSchema);




app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find({}, { _id: 0, name: 1, price: 1, image: 1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.get("/api/orders", async (req, res) => {
  try {
    const orders = await Order.find({}, { _id: 1, productName: 1, price: 1, quantity: 1, image: 1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    const { productName, price, quantity, image } = req.body;
    const newOrder = new Order({
      productName,
      price,
      quantity,
      image,
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

// Add a new API route to handle comments
const commentSchema = new mongoose.Schema({
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
});

const Comment = mongoose.model("Comment", commentSchema);

app.post("/api/comments", async (req, res) => {
  try {
    const { name, lastName, email, address, number, quantity, productName, image, price } = req.body;
    const newComment = new Comment({
      name,
      lastName,
      email,
      address,
      number,
      quantity,
      productName,
      image,
      price,
    });
    await newComment.save();
    res.status(201).json(newComment);
  } catch (error) {
    console.error("Error creating comment:", error); // Log the error
    res.status(500).json({ error: "Failed to create comment" });
  }
});
// **********************************
// const userSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//   },
//   lastName: {
//     type: String,
//   },
//   email: {
//     type: String,
//     required: true,
//   },
//   address: {
//     type: String,
//   },
//   number: {
//     type: String,
//   },
  
// });

// const User = mongoose.model("User", userSchema);

// app.post("/api/users", async (req, res) => {
//   try {
//     const { name, lastName, email, address, number} = req.body;
//     const newUser = new User({
//       name,
//       lastName,
//       email,
//       address,
//       number,
     
//     });
//     await newUser.save();
//     res.status(201).json(newUser);
//   } catch (error) {
//     console.error("Error creating user:", error); // Log the error
//     res.status(500).json({ error: "Failed to create user" });
//   }
// });

// **********************************

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  // Add other fields as needed
});

const User = mongoose.model("User", userSchema);

// API endpoint to register a new user
app.post("/api/users", async (req, res) => {
  try {
    const { name, lastName, email, password } = req.body;

    // Check if the email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Create a new user instance
    const newUser = new User({ name, lastName, email, password });

    // Save the user to the database
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user with the provided email
    const user = await User.findOne({ email });

    // If the user doesn't exist, return an error
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const jwt = require('jsonwebtoken');
    // Check if the provided password matches the user's password
    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign({ userId: user._id }, 'secret_key'); // Change 'secret_key' to your actual secret

    // If credentials are valid, return success response
    res.status(200).json({ message: "Login successful" , token});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
});


// *********************************
// Serve the frontend build (assuming the user page frontend is built and located in the "build" directory)
app.use(express.static("build"));

// If no API route matches, serve the frontend index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`User Page Server is running on port ${PORT}`);
});
