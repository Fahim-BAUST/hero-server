const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require("cors");
const ObjectId = require('mongodb').ObjectId;

require('dotenv').config()


const app = express();
const port = process.env.PORT || 5000;

const stripe = require("stripe")(process.env.STRIPE_SECRET);

app.use(cors());
app.use(express.json());
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rbwav.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function run() {
    try {
        await client.connect();
        const database = client.db("hero_rider");
        const userCollection = database.collection("user");
        const bookCollection = database.collection("book");

        app.get('/books', async (req, res) => {
            const cursor = bookCollection.find({});
            const result = await cursor.toArray();
            res.send(result);
        })


        // GET API 
        app.get('/users', async (req, res) => {
            const cursor = userCollection.find({});
            const result = await cursor.toArray();
            res.send(result);
        })


        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await userCollection.findOne(query);
            res.send(result);
        })

        // POST API 
        //set user to database
        app.post('/users', async (req, res) => {
            const user = req.body;

            const result = await userCollection.insertOne(user);
            res.json(result)
        });


        //get particular order for payment
        app.get('/allOrders/payment/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await userCollection.findOne(query);
            res.send(result);
        })

        //update status
        app.put('/updateStatus/:id', async (req, res) => {
            const id = req.params.id;
            const status = req.body;
            console.log(status);

            const filter = { _id: ObjectId(id) };

            const options = { upsert: true };

            const updateDoc = {
                $set: {
                    isSafe: status.status
                }
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            res.json(result);

        })

        app.post("/create-payment-intent", async (req, res) => {
            const paymentInfo = req.body;
            console.log(paymentInfo);
            const amount = paymentInfo.price * 100

            // Create a PaymentIntent with the order amount and currency
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                automatic_payment_methods: {
                    enabled: true,
                },
            });

            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });


    } finally {
        //   await client.close();
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('Hello !')
})



app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})