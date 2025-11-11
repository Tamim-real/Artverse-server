const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = 3000

app.use(cors())
app.use(express.json());



const uri = "mongodb+srv://artverse-db:yjeOAlbgLE0Zc2ct@nexdev.5cutabm.mongodb.net/?appName=NexDev";


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

    const db = client.db('ArtverseDB')
    const artCollection = db.collection('artgallery');

    app.get('/all-arts', async(req, res)=>{

      const result = await artCollection.find().toArray();
      res.send(result)
    })

    app.get('/all-arts/:id', async (req, res) => {
  const id = req.params.id;
  const result = await artCollection.findOne({ _id: new ObjectId(id) });
  res.send(result);
});

  app.get('/artist-arts/:email', async(req, res)=>{
    const email = req.params.email;

    try{
      const count = await artCollection.countDocuments({userEmail : email})
      res.send({ totalArtworks: count }); 
    }catch (err) {
    console.error(err);
    res.status(500).send({ message: "Failed to fetch artworks count" });
  }
  })


app.get("/myart/:email", async (req, res) => {
  const email = req.params.email; // will get "tamim3052@gmail.com" after decoding
  try {
    const artworks = await artCollection.find({ userEmail: email }).toArray();
    res.send(artworks);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Failed to fetch artworks" });
  }
});


    app.post('/all-arts', async(req, res)=>{
      const data = req.body
      const result = await artCollection.insertOne(data)
      res.send(result)
    })

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
