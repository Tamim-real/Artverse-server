const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection URI
const uri = process.env.DATABASE_URL || "mongodb+srv://artverse-db:yjeOAlbgLE0Zc2ct@nexdev.5cutabm.mongodb.net/?appName=NexDev";

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

    const db = client.db('ArtverseDB');
    const artCollection = db.collection('artgallery');
    const myFavorites = db.collection('myfavorites');

    // Helper to validate MongoDB ObjectIds
    const isValidId = (id) => ObjectId.isValid(id);

    // ================= ARTWORKS ROUTES =================

    // Get all public artworks
    app.get('/all-arts', async (req, res) => {
      try {
        const result = await artCollection.find({ visibility: "Public" }).toArray();
        res.send(result);
      } catch (err) {
        res.status(500).send({ message: "Failed to fetch artworks", error: err.message });
      }
    });

    // Get 6 latest public artworks
    app.get('/latest-arts', async (req, res) => {
      try {
        const result = await artCollection
          .find({ visibility: "Public" })
          .sort({ created_at: -1 })
          .limit(6)
          .toArray();
        res.send(result);
      } catch (err) {
        res.status(500).send({ message: "Failed to fetch latest artworks", error: err.message });
      }
    });

    // Get artwork by ID
    app.get('/all-arts/:id', async (req, res) => {
      try {
        const { id } = req.params;
        if (!isValidId(id)) {
          return res.status(400).send({ message: "Invalid ID format" });
        }
        const result = await artCollection.findOne({ _id: new ObjectId(id) });
        if (!result) {
          return res.status(404).send({ message: "Artwork not found" });
        }
        res.send(result);
      } catch (err) {
        res.status(500).send({ message: "Server error", error: err.message });
      }
    });

    // Create a new artwork
    app.post('/all-arts', async (req, res) => {
      try {
        const data = req.body;
        const result = await artCollection.insertOne({
          ...data,
          created_at: data.created_at ? new Date(data.created_at) : new Date()
        });
        res.status(201).send(result);
      } catch (err) {
        res.status(500).send({ message: "Failed to create artwork", error: err.message });
      }
    });

    // Update artwork details
    app.put("/all-arts/:id", async (req, res) => {
      try {
        const { id } = req.params;
        if (!isValidId(id)) {
          return res.status(400).send({ message: "Invalid ID format" });
        }

        const data = req.body;
        if (data._id) delete data._id; // Ensure we don't try to overwrite MongoDB immutable _id

        const filter = { _id: new ObjectId(id) };
        const update = { $set: data };

        const result = await artCollection.updateOne(filter, update);
        if (result.matchedCount === 0) {
          return res.status(404).send({ message: "Artwork not found" });
        }

        res.send({ _id: id, ...data });
      } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error.message });
      }
    });

    // Delete artwork
    app.delete('/all-arts/:id', async (req, res) => {
      try {
        const { id } = req.params;
        if (!isValidId(id)) {
          return res.status(400).send({ message: "Invalid ID format" });
        }
        const result = await artCollection.deleteOne({ _id: new ObjectId(id) });
        res.send(result);
      } catch (err) {
        res.status(500).send({ message: "Failed to delete artwork", error: err.message });
      }
    });

    // Like / Unlike toggle (Atomic implementation)
    app.put("/all-arts/like/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const { email } = req.body;

        if (!isValidId(id)) {
          return res.status(400).send({ message: "Invalid ID format" });
        }
        if (!email) {
          return res.status(400).send({ message: "Email is required to toggle like" });
        }

        const artId = new ObjectId(id);
        const art = await artCollection.findOne({ _id: artId });

        if (!art) {
          return res.status(404).send({ message: "Artwork not found" });
        }

        const hasLiked = art.likes && art.likes.includes(email);
        const updateQuery = hasLiked 
          ? { $pull: { likes: email } }  // Remove email if already liked
          : { $addToSet: { likes: email } }; // Add email if not liked

        await artCollection.updateOne({ _id: artId }, updateQuery);
        
        // Return fresh updated document
        const updatedArt = await artCollection.findOne({ _id: artId });
        res.send(updatedArt);
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Server error", error: err.message });
      }
    });


    // ================= ARTIST/USER-SPECIFIC ROUTES =================

    // Get artwork count for a specific artist
    app.get('/artist-arts/:email', async (req, res) => {
      try {
        const { email } = req.params;
        const count = await artCollection.countDocuments({ userEmail: email });
        res.send({ totalArtworks: count });
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Failed to fetch artworks count" });
      }
    });

    // Get all artworks of a specific user
    app.get("/myart/:email", async (req, res) => {
      try {
        const { email } = req.params;
        const artworks = await artCollection.find({ userEmail: email }).toArray();
        res.send(artworks);
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Failed to fetch artworks" });
      }
    });


    // ================= FAVORITES ROUTES =================

    // Add to favorites
    app.post('/favorites', async (req, res) => {
      try {
        const data = req.body;
        const result = await myFavorites.insertOne(data);
        res.status(201).send(result);
      } catch (err) {
        res.status(500).send({ message: "Failed to save favorite", error: err.message });
      }
    });

    // Get favorites by user email
    app.get('/my-favorites', async (req, res) => {
      try {
        const { email } = req.query;
        if (!email) {
          return res.status(400).send({ message: "Email query parameter is required" });
        }
        const result = await myFavorites.find({ favorite_by: email }).toArray();
        res.send(result);
      } catch (err) {
        res.status(500).send({ message: "Failed to fetch favorites", error: err.message });
      }
    });

    // Remove favorite (handles both raw string & ObjectId gracefully)
    app.delete('/my-favorites/:id', async (req, res) => {
      try {
        const { id } = req.params;
        
        // Try searching/deleting with dynamic type matching
        const query = isValidId(id) 
          ? { _id: { $in: [id, new ObjectId(id)] } } 
          : { _id: id };

        const result = await myFavorites.deleteOne(query);
        res.send(result);
      } catch (err) {
        res.status(500).send({ message: "Failed to remove favorite", error: err.message });
      }
    });

  } catch (err) {
    console.error("Database connection failure:", err);
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Artverse Server API is running smoothly.')
});

if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

module.exports = app;