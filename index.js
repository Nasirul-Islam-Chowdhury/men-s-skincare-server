const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
require("dotenv").config()
var jwt = require('jsonwebtoken');
const stripe = require("stripe")(process.env.stripe_key);



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bbqqyyb.mongodb.net/?retryWrites=true&w=majority`;
    const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  
  async function run() {
    try {
        await client.connect();
        const servicesCollection = client.db("men's-skin-care").collection("services");
        const bookingsCollection = client.db("men's-skin-care").collection("booking");
        const usersCollection = client.db("men's-skin-care").collection("users");
        const estheticiansColection = client.db("men's-skin-care").collection("estheticians");
        const paymentsColection = client.db("men's-skin-care").collection("payments");
         
        app.get("/", (req, res) => {
            res.send("Men's skincare server running");
          });

          app.post('/payments', async (req, res) => {
            const payment = req.body;
            const result = await paymentsColection.insertOne(payment);
            const id = payment.bookingId
            const filter = {_id: new ObjectId(id)}
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updatedResult = await bookingsCollection.updateOne(filter, updatedDoc)
            res.send(result);
        })

          app.post("/create-payment-intent", async (req, res) => {
            const  {booking}  = req.body;
            const  price  = booking.price;
            const amount = price * 100;
          
            const paymentIntent = await stripe.paymentIntents.create({
              amount: amount,
              currency: "usd",
              "payment_method_types": ["card"],
            });
          
            res.send({
              clientSecret: paymentIntent.client_secret,
            });
          });
        app.get('/limitedServices', async(req, res)=>{
            const query = {};
            const result = await servicesCollection.find(query).limit(3).toArray();
            res.send(result)
        })
        app.get('/services',  async(req, res)=>{
            const query = {};
            const result = await servicesCollection.find(query).toArray();
            res.send(result)
        })
        app.post('/bookings',verifyJwt, async(req, res)=>{
          const booking = req.body;
          const query = {
            date: booking.date,
            careName: booking.careName,
            email: booking.email
          };
          const alreadyBooked = await bookingsCollection.find(query).toArray();
          if (alreadyBooked.length) {
            const message = `You already have an booking on ${booking.date}`;
            return res.send({ acknowleged: false, message });
          }
          const result = await bookingsCollection.insertOne(booking);
          res.send(result);
        });
      

        app.get('/bookings',verifyJwt, async(req, res)=>{
          const email = req.query.email
          const query= {email: email}
          const result = await bookingsCollection.find(query).toArray();
          res.send(result)
        })

        app.get('/bookings/:id', async(req, res)=>{
          const id = req.params.id
          const query= {_id: new ObjectId(id)}
          const result = await bookingsCollection.findOne(query);
          res.send(result)
        })

        app.post('/users', async(req, res)=>{
          const user = req.body;
          const result = await usersCollection.insertOne(user);
          res.send(result)
        })


        app.get("/users", verifyJwt, async (req, res) => {
          const query = {};
          const users = await usersCollection.find(query).toArray();
          res.send(users);
        });

        app.delete("/user/:id",verifyJwt, async (req, res) => {
          const id = req.params.id
          const query = {_id: new ObjectId(id)};
          const users = await usersCollection.deleteOne(query)
          res.send(users);
        });

        app.put("/user/admin/:id",verifyJwt, async (req, res) => {
          const id = req.params.id;
          const filter = { _id: new ObjectId(id) };
          const options = { upsert: true };
          const updatedDoc = {
            $set: {
              role: "admin",
            },
          };
          const result = await usersCollection.updateOne(
            filter,
            updatedDoc,
            options
          );
          res.send(result);
        });


        app.post("/addestheticians",verifyJwt, async (req, res) => {
          const doctor = req.body;
          const result = await estheticiansColection.insertOne(doctor);
          res.send(result);
        });

        app.get("/estheticians", verifyJwt, async (req, res) => {
          const query = {};
          const result = await estheticiansColection.find(query).toArray();
          res.send(result);
        });

        app.delete("/estheticians/:id",verifyJwt, async (req, res) => {
          const id = req.params.id
          const query = {_id: new ObjectId(id)};
          const result = await estheticiansColection.deleteOne(query);
          res.send(result);
        });

        app.get("/jwt", async (req, res) => {
          const email = req.query.email;
          const query = {email:email};
          const user = await usersCollection.findOne(query);
          if (user) {
            var token = jwt.sign({ email }, process.env.jwt_token, {
              expiresIn: "2h",
            });
            return res.send({ accessToken: token });
          }
          return res.status(403).send({ accessToken: " " });
        });

        app.get('/users/admin/:email', async (req, res) => {
          const email = req.params.email;
          const query = { email }
          const user = await usersCollection.findOne(query);
          res.send({ isAdmin: user?.role === 'admin' });
      })


      const verifyAdmin = async (req, res, next) => {
        const decodedEmail = req.decoded.email;
        const query = { email: decodedEmail };
        const user = await usersCollection.findOne(query);

        if (user?.role !== 'admin') {
            return res.status(403).send({ message: 'forbidden access' })
        }
        next();
    }

        function verifyJwt(req, res, next) {
          const authHeader = req.headers.authorization;
          if (!authHeader) { 
            return res.status(401).send("Unauthorized acccess");
          }
          const token = authHeader.split(" ")[1];
          jwt.verify(token, process.env.jwt_token, function (err, decoded) {
            if (err) {
              return res.status(403).send({ message: "forbidden access" });
            }
            req.decoded = decoded;
            next();
          });
        }
    } finally {

    }
  }

run().catch(console.dir);
  

app.listen(port, () => {
  console.log(`Shine men server port ${port}`);
});
