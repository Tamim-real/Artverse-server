const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
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

    app.post('/all-arts', async(req, res)=>{

      const result = await artCollection.insertOne()
    })

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
