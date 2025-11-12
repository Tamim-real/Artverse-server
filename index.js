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

      const result = await artCollection.find({ visibility: "Public" }).toArray();
      res.send(result)
    })

     app.get('/latest-arts', async(req, res)=>{

      const result = await artCollection.find({ visibility: "Public" }).sort({created_at : -1}).limit(6).toArray();
      res.send(result)
    })



    app.get('/all-arts/:id', async (req, res) => {
  const id = req.params.id;
  const result = await artCollection.findOne({ _id: new ObjectId(id) });
  res.send(result);
});

app.put("/all-arts/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid ID format" });
    }

    const data = req.body;

    
    if (data._id) delete data._id;

    const filter = { _id: new ObjectId(id) };
    const update = { $set: data };

    const result = await artCollection.updateOne(filter, update);

    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "Artwork not found" });
    }

    res.send({ _id: id, ...data });
  } catch (error) {
    
    res.status(500).send({ message: "Internal Server Error" });
  }
});



app.put("/all-arts/like/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const email = req.body.email;
   

    const art = await artCollection.findOne({ _id: new ObjectId(id) });
   

    art.likes = art.likes || []; 
    let updatedLikes;
    if (art.likes.includes(email)) {
      updatedLikes = art.likes.filter(e => e !== email);
    } else {
      updatedLikes = [...art.likes, email]; 
    }

    await artCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { likes: updatedLikes } }
    );

    const updatedArt = await artCollection.findOne({ _id: new ObjectId(id) });
    res.send(updatedArt);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error", error: err.message });
  }
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
  const email = req.params.email; 
  try {
    const artworks = await artCollection.find({ userEmail: email }).toArray();
    res.send(artworks);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Failed to fetch artworks" });
  }
});

app.delete('/all-arts/:id', async(req, res)=>{
    const id = req.params.id;
    const result = await artCollection.deleteOne({ _id: new ObjectId(id) })
    res.send(result)
})


    app.post('/all-arts', async(req, res)=>{
      const data = req.body
      const result = await artCollection.insertOne(data)
      res.send(result)
    })

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
    
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
