const express = require("express");
const cors = require("cors");
const multer = require("multer");
require("dotenv").config();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads");
  },
  filename: function (req, file, cb) {
    const extention = file.mimetype.split("/")[1];
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + `.${extention}`);
  },
});

const upload = multer({ storage: storage });

const app = express();
const port = 3000;

app.use(express.static("./public"));

app.use(
  cors({
    origin: ["http://localhost:5173", "https://seo-page-1-job-task.surge.sh"],
  })
);

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.aovrcn7.mongodb.net/?retryWrites=true&w=majority`;

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
    app.get("/api/data", async (req, res) => {
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
      res.send(data);
    });

    app.post("/api/file/upload/:id", upload.array("files"), async (req, res) => {
      const id = req.params;
      const data = await dataCollection.findOne({ _id: new ObjectId(id) });
      const attachUrls = [];
      req.files.map((file) =>
        attachUrls.push(process.env.DOMAIN_NAME + "uploads/" + file.filename)
      );
      const updateDoc = {
        $set: {
          attachFile: [...data?.attachFile, ...attachUrls],
        },
      };
      await dataCollection.updateOne({ _id: new ObjectId(id) }, updateDoc);
      res.send({ message: "file upload successfull" });
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
