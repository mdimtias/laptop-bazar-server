const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();

app.use(express.json());
app.use(cors());

const uri = process.env.URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// Collection
const Users = client.db("secondHandLaptop").collection("users");
const Category = client.db("secondHandLaptop").collection("categories");
const Products = client.db("secondHandLaptop").collection("products");
const Orders = client.db("secondHandLaptop").collection("orders");
const Blogs = client.db("secondHandLaptop").collection("blogs");
const Wishlist = client.db("secondHandLaptop").collection("wishlist");
const ReportedProduct = client
  .db("secondHandLaptop")
  .collection("reportedProduct");
const Subscribe = client.db("secondHandLaptop").collection("subscribe");

async function run() {
  try {
    await client.connect();
    console.log("Database Connect Successful");

    // Create Jwt Token
    app.post("/createJwtToken", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "30d",
      });
      res.send({
        data: token,
        success: true,
        message: "JWT Token Generate Successful",
      });
    });

    // User Admin
    app.put("/users/admin/:id", verifyJwt, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const option = { upsert: true };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await Users.updateOne(filter, updateDoc, option);
      res.send(result);
    });

    // seller verify
    app.put("/users/seller/:id", verifyJwt, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const option = { upsert: true };
      const updateDoc = {
        $set: {
          status: "verified",
        },
      };
      const result = await Users.updateOne(filter, updateDoc, option);
      res.send(result);
    });

    // Get Admin
    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await Users.findOne(query);
      const role = user?.role;
      res.send({ role: role });
      //   res.send({ isAdmin: user?.role === "admin" });
    });
  } catch (error) {
    console.log(error.message);
  }
}
run();

app.get("/", (req, res) => {
  res.send("Done");
});
// Verify JWT Token
function verifyJwt(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized" });
  }
  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized" });
    }

    req.decoded = decoded;
    next();
  });
}

const verifyAdmin = async (req, res, next) => {
  const decodedEmail = req.decoded.email;
  const query = { email: decodedEmail };
  const user = await Users.findOne(query);
  if (user?.role !== "admin") {
    return res.status(403).send({ message: "Forbidden Access" });
  }

  next();
};
// Create User Data
app.put("/users/:email", async (req, res) => {
  const user = req.body;
  const email = req.params.email;
  const filter = { email: email };
  const option = { upsert: true };
  const updateDoc = {
    $set: user,
  };
  const result = await Users.updateOne(filter, updateDoc, option);

  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "30d",
  });
  res.send({
    data: result,
    token: token,
    success: true,
    message: "Successfully Created User",
  });
});

// Get All User Data
app.get("/users", verifyJwt, verifyAdmin, async (req, res) => {
  try {
    const query = {};
    const result = await Users.find({}).toArray();
    res.send({
      data: result,
      success: true,
      message: "Successfully find the all data",
    });
  } catch (error) {
    res.send({
      data: error,
      success: false,
      message: "Data Load Fail",
    });
  }
});

// Filter data by user role
app.get("/users/:role", verifyJwt, verifyAdmin, async (req, res) => {
  try {
    const query = {};
    const userRole = req.params.role;
    const filter = { role: userRole };
    const result = await Users.find(filter).toArray();
    res.send({
      data: result,
      success: true,
      message: "Successfully find the all data",
    });
  } catch (error) {
    res.send({
      data: error,
      success: false,
      message: "Data Load Fail",
    });
  }
});

// Delete User
app.delete("/users/:id", verifyJwt, verifyAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const filter = { _id: ObjectId(id) };
    const result = await Users.deleteOne(filter);
    res.send({
      data: result,
      success: true,
      message: "Successfully delete User",
    });
  } catch (error) {
    res.send({
      data: error,
      success: false,
      message: "Data Delete Fail",
    });
  }
});

// Create Category Data
app.post("/category", verifyJwt, verifyAdmin, async (req, res) => {
  try {
    const category = req.body;
    const result = await Category.insertOne(category);
    res.send({
      data: result,
      success: true,
      message: "Category Created Successful",
    });
  } catch (error) {
    res.send({
      data: error,
      success: false,
      message: "Category Created Fail",
    });
  }
});

// Get All Category Data
app.get("/category", async (req, res) => {
  try {
    const query = {};
    const result = await Category.find({}).toArray();
    res.send({
      data: result,
      success: true,
      message: "Successfully find the all data",
    });
  } catch (error) {
    res.send({
      data: error,
      success: false,
      message: "Data Load Fail",
    });
  }
});

app.delete("/category/:id", verifyJwt, verifyAdmin, async (req, res) => {
  const id = req.params.id;
  const filter = { _id: ObjectId(id) };
  const result = await Category.deleteOne(filter);
  res.send(result);
});

// Create Product Data
app.post("/products", async (req, res) => {
  try {
    const category = req.body;
    const result = await Products.insertOne(category);
    res.send({
      data: result,
      success: true,
      message: "Created Product Successful",
    });
  } catch (error) {
    res.send({
      data: error,
      success: false,
      message: "Category Created Fail",
    });
  }
});

// Get All Products Data
app.get("/products", async (req, res) => {
  try {
    const query = {};
    const result = await Products.find(query).toArray();
    res.send({
      data: result,
      success: true,
      message: "Successfully find the all Product data",
    });
  } catch (error) {
    res.send({
      data: error,
      success: false,
      message: "Data Load Fail",
    });
  }
});

// Get Product By Email
app.get("/products/:email", verifyJwt, async (req, res) => {
  try {
    const email = req.params.email;
    const filter = { email: email };
    const result = await Products.find(filter).toArray();
    res.send({
      data: result,
      success: true,
      message: "Successfully find the all Product data By Email",
    });
  } catch (error) {
    res.send({
      data: error,
      success: false,
      message: "Data Load Fail",
    });
  }
});
// Get Product By Advertise
app.get("/product-advertise", async (req, res) => {
  try {
    const filter = { advertise: "yes" };
    const result = await Products.find(filter).toArray();
    res.send({
      data: result,
      success: true,
      message: "Successfully find the all Product data By advertise",
    });
  } catch (error) {
    res.send({
      data: [],
      success: false,
      message: "Data Load Fail",
    });
  }
});
// Get Product By Brand
app.get("/product/:brand", async (req, res) => {
  try {
    const brand = req.params.brand;
    const filter = { brand: brand };
    console.log(filter);
    const result = await Products.find(filter).toArray();
    res.send({
      data: result,
      success: true,
      message: "Successfully find the all Product data By Brand",
    });
  } catch (error) {
    res.send({
      data: error,
      success: false,
      message: "Data Load Fail",
    });
  }
});

// Get Product By Category Id
app.get("/category/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const filter = { id: id };
    const result = await Products.find(filter).toArray();
    res.send({
      data: result,
      success: true,
      message: "Successfully find the all Category data",
    });
  } catch (error) {
    res.send({
      data: error,
      success: false,
      message: "Data Load Fail",
    });
  }
});

// Delete Product
app.delete("/products/:id", verifyJwt, verifyAdmin, async (req, res) => {
  const id = req.params.id;
  const filter = { _id: ObjectId(id) };
  const result = await Products.deleteOne(filter);
  res.send(result);
});

// Add New field by all product, If You Need Manually
app.put("/product/", async (req, res) => {
  const filter = { brand: "D-Link" };
  const options = { upsert: true };
  const updateDoc = {
    $set: {
      brand_title:
        "D-Link Corporation is a Taiwanese multinational networking equipment manufacturing corporation headquartered in Taipei",
    },
  };
  const result = await Products.updateMany(filter, updateDoc, options);
  // const result =  Products.updateMany({}, {$rename:{"name":"product_name"}}, false, true)

  res.send({ result });
});

app.put("/adver/:title", async (req, res) => {
  try {
    const body = req.body;
    console.log(body);
    const title = req.params.title;
    const filter = { _id: ObjectId(title) };
    const options = { upsert: true };
    const updateDoc = {
      $set: {
        advertise: "yes",
      },
    };
    const result = await Products.updateMany(filter, updateDoc, options);
    // const result =  Products.updateMany({}, {$rename:{"name":"product_name"}}, false, true)

    res.send({ data: result, success: true, message: "Advertise Successful" });
  } catch (error) {
    res.send({
      data: error,
      success: false,
      message: "Blog Created Fail",
    });
  }
});

// Create Blog Post Data
app.post("/blog", async (req, res) => {
  try {
    const blog = req.body;
    const result = await Blogs.insertOne(blog);
    res.send({
      data: result,
      success: true,
      message: "Blog Created Successful",
    });
  } catch (error) {
    res.send({
      data: error,
      success: false,
      message: "Blog Created Fail",
    });
  }
});

// Get All Blogs Data
app.get("/blog", async (req, res) => {
  try {
    const query = {};
    const result = await Blogs.find(query).toArray();
    res.send({
      data: result,
      success: true,
      message: "Successfully find the all Blogs data",
    });
  } catch (error) {
    res.send({
      data: error,
      success: false,
      message: "Data Load Fail",
    });
  }
});

// Find Blog Data By Id
app.get("/blog/:id", async (req, res) => {
  const id = req.params.id;
  const filter = { _id: ObjectId(id) };
  const result = await Blogs.find(filter).toArray();
  res.send({
    data: result,
    success: true,
    message: "Successfully Find the blog data",
  });
});

// Create Order Data
app.post("/orders", verifyJwt, async (req, res) => {
  try {
    const order = req.body;
    console.log(order);
    const result = await Orders.insertOne(order);
    res.send({
      data: result,
      success: true,
      message: "Successfully Place Your Order",
    });
  } catch (error) {
    res.send({
      data: result,
      success: false,
      message: "Order fail",
    });
  }
});

// Get All Order Data
app.get("/orders", verifyJwt, async (req, res) => {
  try {
    const query = {};
    const result = await Orders.find(query).toArray();
    res.send({
      data: result,
      success: true,
      message: "Successfully find the all Order data",
    });
  } catch (error) {
    res.send({
      data: error,
      success: false,
      message: "Data Load Fail",
    });
  }
});

// Find Order Data By Email
app.get("/orders/:email", verifyJwt, async (req, res) => {
  try {
    const email = req.params.email;
    const filter = { email: email };
    const result = await Orders.find(filter).toArray();
    res.send({
      data: result,
      success: true,
      message: "Successfully Find the Order data",
    });
  } catch (error) {
    res.send({
      data: error,
      success: false,
      message: "Data Load Fail",
    });
  }
});

// Create Wishlist Data
app.post("/wishlist/:email/:id", verifyJwt, async (req, res) => {
  const id = req.params.id;
  if (parseInt(id.length) !== 24) {
    return res.send({
      data: { message: "Id length must be 24 characters" },
      success: false,
      message: "Please try to add different id"
    })
  }

  try {
    const wishlist = req.body;
    const email = req.params.email;
    const findWishlist = await Wishlist.findOne({ email: email, product_id: id })
    const products = await Products.findOne({ _id: ObjectId(id) })

    if (!products) {
      return res.send({
        data: { message: "Product id is incorrect" },
        success: false,
        message: "wrong product id"
      })
    } else if (findWishlist) {
      res.send({
        data: { message: "Already Added Wishlist This Product" },
        added: true,
        message: "Successfully Added Wishlist Product",
      });
    } else {
      const result = await Wishlist.insertOne(wishlist);
      res.send({
        data: result,
        success: true,
        message: "Successfully Added Wishlist Product",
      });
    }
  } catch (error) {
    res.send({
      data: error,
      success: false,
      message: "Wishlist add fail",
    });
  }
});

// Update Wishlist Data
app.put("/wishlist/:email/", verifyJwt, async (req, res) => {
  try {
    const wishlist = req.body;
    const email = req.params.email;
    const filter = {
      wishlistEmail: email,
      product_name: wishlist.product_name,
    };
    console.log(filter);
    const option = { upsert: true };
    const updateDoc = {
      $set: wishlist,
    };
    const result = await Wishlist.updateOne(filter, updateDoc, option);
    res.send({
      data: result,
      success: true,
      message: "Successfully Updated wishlist",
    });
  } catch (error) {
    res.send({
      data: error,
      success: false,
      message: "Wishlist fail",
    });
  }
});

// Get All WishList Data
app.get("/wishlist", async (req, res) => {
  try {
    const query = {};
    const result = await Wishlist.find(query).toArray();
    res.send({
      data: result,
      success: true,
      message: "Successfully find the all wishlist data",
    });
  } catch (error) {
    res.send({
      data: error,
      success: false,
      message: "Data Load Fail",
    });
  }
});

// Find Wishlist Data By Email
app.get("/wishlist/:email", verifyJwt, async (req, res) => {
  try {
    const email = req.params.email;
    const filter = { email: email };
    const result = await Wishlist.find(filter).toArray();
    res.send({
      data: result,
      success: true,
      message: `Successfully Find the wishlist data by email ${email}`,
    });
  } catch (error) {
    res.send({
      data: error,
      success: false,
      message: "Data Load Fail",
    });
  }
});

// Delete wishlist product by product name
app.delete("/wishlist/:name", verifyJwt, async (req, res) => {
  try {
    const name = req.params.name;
    // Id not working
    // const filter = { _id: ObjectId(id) };
    const filter = { product_name: name };
    const result = await Wishlist.deleteOne(filter);
    res.send({
      data: result,
      success: true,
      message: "Successfully delete User",
    });
  } catch (error) {
    res.send({
      data: error,
      success: false,
      message: "Data Delete Fail",
    });
  }
});

// Create Reported Data
app.put("/reportedProduct/:id", verifyJwt, async (req, res) => {
  try {
    const wishlist = req.body;
    console.log(wishlist);
    const id = req.params.id;
    const filter = { reportedEmail: id };
    // const filter = { _id: ObjectId(id) };
    console.log(filter);
    const option = { upsert: true };
    const updateDoc = {
      $set: wishlist,
    };
    const result = await ReportedProduct.updateOne(filter, updateDoc, option);
    res.send({
      data: result,
      success: true,
      message: "Successfully Added wishlist",
    });
  } catch (error) {
    res.send({
      data: error,
      success: false,
      message: "Wishlist fail",
    });
  }
});

// Get All Reported Data
app.get("/reportedProduct", verifyJwt, verifyAdmin, async (req, res) => {
  try {
    const query = {};
    const result = await ReportedProduct.find(query).toArray();
    res.send({
      data: result,
      success: true,
      message: "Successfully find the all Reported Product",
    });
  } catch (error) {
    res.send({
      data: error,
      success: false,
      message: "Data Load Fail",
    });
  }
});

// Create Subscribe Data
app.put("/subscribe/:email", async (req, res) => {
  try {
    const emailSubscribe = req.body;
    console.log(emailSubscribe);
    const email = req.params.email;
    const filter = { email: email };
    // const filter = { _id: ObjectId(id) };
    console.log(filter);
    const option = { upsert: true };
    const updateDoc = {
      $set: emailSubscribe,
    };
    const result = await Subscribe.updateOne(filter, updateDoc, option);
    res.send({
      data: result,
      success: true,
      message: "Successfully Subscribe",
    });
  } catch (error) {
    res.send({
      data: error,
      success: false,
      message: "Subscribe fail",
    });
  }
});

// Get All Subscribe Data
app.get("/subscribe", verifyJwt, verifyAdmin, async (req, res) => {
  try {
    const query = {};
    const result = await Subscribe.find(query).toArray();
    res.send({
      data: result,
      success: true,
      message: "Successfully find the all Reported Product",
    });
  } catch (error) {
    res.send({
      data: error,
      success: false,
      message: "Data Load Fail",
    });
  }
});

app.listen(process.env.PORT || 5000, () => {
  console.log("Server Running SuccessFull Port", process.env.PORT);
});
