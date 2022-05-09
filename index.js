const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const express = require("express");

const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(cors()); //middleware
app.use(express.json()); //middleware for undefined
//verify token function
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  if (token.length < 500) {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).send({ message: "Forbidden access " });
      }
      req.decoded = decoded;
      next();
    });
  } else {
    const decoded = jwt.decode(token);

    req.decoded = decoded;
    next();
  }
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nitd8.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {   useNewUrlParser: true,
   useUnifiedTopology: true, 
   serverApi: ServerApiVersion.v1 });

   async function run() {
    try {
      await client.connect();
      const productCollection = client
        .db("furneture")
        .collection("product");
      const servicesCollection = client
        .db("furneture")
        .collection("service");
      const reviewsCollection = client
        .db("furneture")
        .collection("reviews");

      //get all product

      app.get("/product", async (req, res) => {
        const query = {};
        const cursor = productCollection.find(query);
        const product = await cursor.toArray();
        res.send(product);
      });
      //get only logged in user's product
      app.get("/items", verifyJWT, async (req, res) => {
        const decodedEmail = req?.decoded?.email;
        const email = req.query.email;
        if (email === decodedEmail) {
          const query = { email: email };
          const cursor = productCollection.find(query);
          const items = await cursor.toArray();
          res.send(items);
        } else {
          res.status(403).send({ message: "Forbidden Access " });
        }
      });
      //get one product
      app.get("/product/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const result = await productCollection.findOne(query);
        res.send(result);
      });
      //update one quantity
      app.put("/product/:id", async (req, res) => {
        const id = req.params.id;
        const updatedQuantity = req.body;
        const filter = { _id: ObjectId(id) };
        const options = { upsert: true };
        const updatedDoc = {
          $set: {
            quantity: updatedQuantity.quantity,
          },
        };
        const result = await productCollection.updateOne(
          filter,
          updatedDoc,
          options
        );
  
        res.send(result);
      });
      //delete inventory
      app.delete("/product/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const result = await productCollection.deleteOne(query);
        res.send(result);
      });
      //add inventory
      app.post("/product", async (req, res) => {
        const addproduct = req.body;
        console.log("adding new inventory", addproduct);
        const result = await productCollection.insertOne(addproduct);
        res.send(result);
      });
  
      //Auth
      app.post("/login", async (req, res) => {
        const user = req.body;
        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: "1d",
        });
        res.send({ accessToken });
      });
  
      //get all services
      app.get("/service", async (req, res) => {
        const query = {};
        const cursor = servicesCollection.find(query);
        const services = await cursor.toArray();
        res.send(services);
      });
      //get all reviews
      app.get("/review", async (req, res) => {
        const query = {};
        const cursor = reviewsCollection.find(query);
        const reviews = await cursor.toArray();
        res.send(reviews);
      });
    } finally {
    }
  }
  run().catch(console.dir);
  
  app.get("/", (req, res) => {
    res.send("Running EIMS server");
  });
  app.listen(port, () => {
    console.log("listening to port", port);
  });
  