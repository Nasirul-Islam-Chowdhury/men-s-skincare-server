const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
require("dotenv").config()


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
         
        app.get("/", (req, res) => {
            res.send("Men's skincare server running");
          });

        app.get('/limitedServices', async(req, res)=>{
            const query = {};
            const result = await servicesCollection.find(query).limit(3).toArray();
            res.send(result)
        })
        app.get('/services', async(req, res)=>{
            const query = {};
            const result = await servicesCollection.find(query).toArray();
            res.send(result)
        })
        app.post('/bookings', async(req, res)=>{
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
      

        app.get('/bookings', async(req, res)=>{
          const email = req.query.email
          const query= {email: email}
          const result = await bookingsCollection.find(query).toArray();
          res.send(result)
        })

        app.post('/users', async(req, res)=>{
          const user = req.body;
          const result = await usersCollection.insertOne(user);
          res.send(result)
        })


        app.get("/users", async (req, res) => {
          const query = {};
          const users = await usersCollection.find(query).toArray();
          res.send(users);
        });

        app.delete("/user/:id", async (req, res) => {
          const id = req.params.id
          const query = {_id: new ObjectId(id)};
          const users = await usersCollection.deleteOne(query)
          res.send(users);
        });

        app.put("/user/admin/:id", async (req, res) => {
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

    } finally {

    }
  }

run().catch(console.dir);
  

app.listen(port, () => {
  console.log(`Shine men server port ${port}`);
});
