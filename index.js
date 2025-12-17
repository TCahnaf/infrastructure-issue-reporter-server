const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 3000
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const stripe = require('stripe')(process.env.STRIPE_SECRET);


const admin = require("firebase-admin");

const serviceAccount = require("./nyc-infra-report-firebase-adminsdk-fbsvc-cd285371df.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});



app.use(express.json());
app.use(cors());

const verifyFBToken = async (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).send({ message: 'unauthorized access' })
    }

    try {
        const idToken = token.split(' ')[1];
        const decoded = await admin.auth().verifyIdToken(idToken);
        console.log('decoded in the token', decoded);
        req.decoded_email = decoded.email;
        next();
    }
    catch (err) {
        return res.status(401).send({ message: 'unauthorized access' })
    }


}







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
    const paymentsCollection = db.collection('payments')
    const staffsCollection = db.collection('staff');
    const logsCollections = db.collection('logs');

const verifyAdmin = async (req, res, next) => {
            const email = req.decoded_email;
            const query = { email };
            const user = await usersCollection.findOne(query);

            if (!user || user.role !== 'admin') {
                return res.status(403).send({ message: 'forbidden access' });
            }

            next();
        }


 const verifyStaff = async (req, res, next) => {
            const email = req.decoded_email;
            const query = { email };
            const user = await usersCollection.findOne(query);

            if (!user || user.role !== 'staff') {
                return res.status(403).send({ message: 'forbidden access' });
            }

            next();
        }


    //issue related api's

    app.get('/issues', verifyFBToken, async (req, res) => {
        const limit = parseInt(req.query.limit);
        const query = {};
        const category = req.query.category;
        const status = req.query.status;
        const email = req.query.email;
          if (category) {
            query.category = category
        }
          if (status) {
            query.status = status
        }

        if(email){
          if (email !== req.decoded_email) {
            return res.status(403).send({ message: 'forbidden access' });
        }
          query.userEmail = email;
        }

           let cursor = issuesCollection.find(query)
             if(limit){
             cursor = cursor.limit(limit)
          
        }

        const result = await cursor.toArray();
        res.send(result)

        






    })

    app.post('/issues', async(req, res) => {

        const issue = req.body;
        issue.priority = "normal";
        issue.status = "pending"
        issue.upvoteCount = 0;
        issue.assignedStaffName = "";
        issue.assignedStaffEmail = "";
        const result = await issuesCollection.insertOne(issue);

        await usersCollection.updateOne(
       {email: issue.userEmail},
       {$inc: {issuesCount:1}}

        )

        

        

        await logsCollections.insertOne(
          {
            issueId: result.insertedId,
            event: {
              type: "ISSUE_CREATED",
              createdAT: new Date ()

            }
          }
        )

        res.send(result)

      

    })


    //increment/decrement upvotecount
    app.patch('/issues/:id/vote', async(req,res) => {

     const id = req.params.id
      const query = {_id: new ObjectId(id)}


      if((req.body.vote) === 'like') {
          const result = await issuesCollection.updateOne(query, {$inc: {upvoteCount:1}})
          res.send(result)

      }

      else {

         const result = await issuesCollection.updateOne(query, {$inc: {upvoteCount:-1}})
         res.send(result)

      }

    })

    app.patch('/issue/:id', async(req,res)=> {

      const id = req.params.id
      const updatedInfo = req.body;
      const query = {_id: new ObjectId(id)}

      const update = {

        $set: {
          title: updatedInfo.title,
          category: updatedInfo.category,
          location: updatedInfo.location,
          description: updatedInfo.description,
          photo: updatedInfo.photo
        }


      }

      const result = await issuesCollection.updateOne(query, update)
      
       await logsCollections.insertOne(
          {
            issueId: result.insertedId,
            event: {
              type: "ISSUE_CREATED",
              createdAT: new Date ()

            }
          }
        )


      res.send(result)

    })


    //update issue record with staff info

    app.patch('/issues/:id/assign-staff', async(req,res) => {

      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const updateInfo = req.body;

      const update = {
        $set: {

          assignedStaffName: updateInfo.name,
          assignedStaffEmail: updateInfo.email, 
        }

  
      }

         const result = await issuesCollection.updateOne(query,update)

          await logsCollections.insertOne(
          {
            issueId: result.insertedId,
            event: {
              type: "STAFF_ASSIGNED",
              staffName: updateInfo.name ,
              createdAT: new Date ()

            }
          }

        
        )

          res.send(result)








    })

    app.patch('/issue/:id/reject', async(req,res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id) }
      const updateInfo = req.body.status
      const update = {
        $set:{
          status: updateInfo

        }
      }
       const result = await issuesCollection.updateOne(query,update)

       res.send(result)

    })

    app.patch('/issue/:id/staff-updates', async(req,res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id) }
      const updateInfo = req.body.status
      const update = {
        $set:{
          status: updateInfo

        }
      }
       const result = await issuesCollection.updateOne(query,update)

       await logsCollections.insertOne(
          {
            issueId: new ObjectId(id),
            event: {
              type: `ISSUE_NOW_${updateInfo.toUpperCase()}`,
              createdAT: new Date ()

            }
          }
        )

       res.send(result)

    })

    app.get('/issues/assigned',verifyFBToken, verifyStaff, async(req,res) =>{

      const email = req.query.email
      const query = {}
      if(email){
        if (email === req.decoded_email) {
        query.assignedStaffEmail = email
      }}

      const result = await issuesCollection.find(query).toArray()

      res.send(result)
    })





    app.delete('/issues/:id', async (req,res) => {
      const id = req.params.id
      const query = {_id: new ObjectId(id)}

      const issueRecord = await issuesCollection.findOne(query)

      await usersCollection.updateOne({email: issueRecord.userEmail},  { $inc: { issuesCount: -1 } } )


      const result = await issuesCollection.deleteOne(query)




      res.send(result)
    })

    




    // user collection related api's
     app.get('/user', verifyFBToken, async (req, res) => {
      const query = {}
      const email = req.query.email
      if (email){
        query.email = email;
      }

      const result = await usersCollection.findOne(query);

      res.send(result)


    })


    //admin operation
    app.get('/users', verifyFBToken, verifyAdmin, async (req, res) => {
     const cursor = usersCollection.find({})

      const result =  await cursor.toArray();

      res.send(result)


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


    app.patch('/users/:id', verifyFBToken, async (req, res) => {
        const userInfo = req.body;
        const id = req.params.id
        const query = {_id: new ObjectId(id)}

        const update = {

        $set: {

          photo: userInfo.photo,
          name: userInfo.name


        }


      }

      const result = await usersCollection.updateOne(query, update)

     
        res.send(result)
    } )


    app.patch('/user/:id/status',verifyFBToken, verifyAdmin, async(req,res) => {
      const id = req.params.id;
      const requested_status = req.body.status;
      const query = {_id: new ObjectId(id) }
      const update = {
        $set: {
          status: requested_status
        }
      }

      const result = await usersCollection.updateOne(query, update)

      res.send(result)
    })


    


    //staff related API's
    app.get('/staffs', verifyFBToken, verifyAdmin, async(req,res) => {

      const query = {role:'staff'}

      const cursor = usersCollection.find(query)
      const result = await cursor.toArray();

      res.send(result)
    })


    



     app.post('/staffs', verifyFBToken, verifyAdmin, async(req,res) => {

      const staffInfo = req.body;
      const email = staffInfo.email

      const staffExists = await usersCollection.findOne({email})
      if(staffExists) {
            return res.send({message: 'staff already exists'})
        }

      const result = await usersCollection.insertOne(staffInfo)

      res.send(result)
    })


     app.patch('/staffs/:id', async (req, res) => {
        const userInfo = req.body;
        const id = req.params.id
        const query = {_id: new ObjectId(id)}

        const update = {

        $set: {

          photo: userInfo.photo,
          name: userInfo.name


        }


      }

      const result = await usersCollection.updateOne(query, update)

     
        res.send(result)
    } )

     app.delete('/staffs/:id', async (req,res) => {
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await usersCollection.deleteOne(query)
      res.send(result)
    })


    app.post('/create-staff', async(req, res) => {
      const staffInfo = req.body
       const staffExists = await usersCollection.findOne({email:staffInfo.email})
      if(staffExists) {
            return res.send({message: 'staff already exists'})
        }


      
      const staffRecord = await admin.auth().createUser(
        {
          email:staffInfo.email,
          password: staffInfo.password,
          displayName: staffInfo.name,
          photoURL: staffInfo.photo
        }

      );

      const dbRecord = {
        uid: staffRecord.uid,
        email:staffInfo.email,
        name:staffInfo.name,
        photo:staffInfo.photo,
        role: 'staff'
      }

     
      const result = await usersCollection.insertOne(dbRecord)

      res.send(result);

    })



    

//payment API's

app.post('/create-checkout-session', async (req, res) => {

  const paymentInfo = req.body;

        const amount = parseInt(paymentInfo.cost) * 100;
    

            const session = await stripe.checkout.sessions.create({
                line_items: [
                    {
                        price_data: {
                            currency: 'USD',
                            unit_amount: amount,
                            product_data: {
                                name: 'premium-subscription'
                            }
                        },
                        quantity: 1,
                    },
                ],
                customer_email: paymentInfo.subscriberEmail,
                mode: 'payment',
                metadata: {
                    subscriberEmail: paymentInfo.subscriberEmail
                },
                success_url: `${process.env.SITE_DOMAIN}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.SITE_DOMAIN}/dashboard/payment-cancelled`,
            })

            console.log(session)
            res.send({ url: session.url })

  



   
});

 app.patch('/payment-success', async (req, res) => {
            const sessionId = req.query.session_id;

            const session = await stripe.checkout.sessions.retrieve(sessionId);

            console.log('session retrieve', session)
           

            if (session.payment_status === 'paid') {
            const query = { email:session.metadata.subscriberEmail};
            
                 const update = {
                    $set: {
                        subscription: 'premium',
                      
                    }
                }

                const result = await usersCollection.updateOne(query, update);

                const payment = {
                    amount: session.amount_total / 100,
                    currency: session.currency,
                    customerEmail: session.customer_email,
                    transactionId: session.payment_intent,
                    paymentStatus: session.payment_status,
                    paidAt: new Date()
                }

                    const resultPayment = await paymentsCollection.insertOne(payment)

                     
                

                res.send(result)

             }

             res.send({ success: false })
        
    })

    app.get('/payments', verifyFBToken, verifyAdmin, async(req,res)=>{

      const query = {}
      const sortOrder = req.query.sortBy;
     

      let sortOption = {};
      if(sortOrder === "high"){
        sortOption = { amount: -1}
      }
      else if ( sortOrder === "low"){
        sortOption = {amount:1}
      }
      const result = await paymentsCollection
            .find(query)
            .sort(sortOption)
            .toArray();

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
