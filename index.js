const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 3000
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');



app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vdtwnfb.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // db and collections
    await client.connect();
    const db = client.db('issue_report_db');
    const usersCollection = db.collection('users');
    const issuesCollection = db.collection('issues');


    //issue related api's

    app.get('issues', async (req, res) => {
    })

    app.post('issues', async(req, res) => {

        const issue = req.body;
        const result = await issuesCollection.insertOne(issue);
        res.send(result)

    })


    // user related api's
     app.get('users', async (req, res) => {
    })

    app.post('/users', async (req, res) => {
        const user = req.body;
        user.role = 'user';
        user.subscription = 'free';
        user.issuesCount = 0;
        user.status = 'active';
        const email = user.email
        const userExists = await usersCollection.findOne({email})
        if(userExists) {
            return res.send({message: 'user already exists'})
        }
        const result = await usersCollection.insertOne(user);
        res.send(result)
    })



    









    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);







app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
