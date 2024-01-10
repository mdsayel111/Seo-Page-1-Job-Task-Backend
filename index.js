const express = require("express");
const cors = require("cors");

const app = express();
const port = 3000;

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri =
  "mongodb+srv://mdsayel111:fZB1I3EFRkM1d1vc@cluster0.aovrcn7.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const database = client.db("Seo-Page-1-Job-Task");

const dataCollection = database.collection("Data");

async function run() {
  try {
    app.get("/data", async (req, res) => {
      const data = await dataCollection
        .aggregate([
          {
            $group: {
              _id: "$status",
              data: { $push: "$$ROOT" },
            },
          },
          {
            $project: {
              _id: 1,
              count: 1,
              data: 1,
              customSortOrder: {
                $switch: {
                  branches: [
                    { case: { $eq: ["$_id", "incomplete"] }, then: 1 },
                    { case: { $eq: ["$_id", "todo"] }, then: 2 },
                    { case: { $eq: ["$_id", "doing"] }, then: 3 },
                    { case: { $eq: ["$_id", "under review"] }, then: 4 },
                    { case: { $eq: ["$_id", "complete"] }, then: 5 },
                    { case: { $eq: ["$_id", "Overd"] }, then: 6 },
                  ],
                },
              },
            },
          },
          {
            $sort: {
              customSortOrder: 1,
            },
          },
          {
            $project: {
              _id: 1,
              count: 1,
              data: 1,
            },
          },
        ])
        .toArray();
      console.log(data);
      res.send(data);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
