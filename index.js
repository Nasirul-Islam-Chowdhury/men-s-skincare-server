const { MongoClient, ServerApiVersion } = require('mongodb');
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
         
        app.get("/", (req, res) => {
            res.send("Men's skincare server running");
          });

        app.get('/limitedServices', async(req, res)=>{
            const query = {};
            const result = await servicesCollection.find(query).limit(3).toArray();
            res.send(result)
        })

    } finally {

    }
  }

run().catch(console.dir);
  

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
