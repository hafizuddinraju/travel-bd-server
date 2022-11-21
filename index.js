const express = require('express')
const cors = require('cors')
const app = express()
require('dotenv').config()
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
app.use(cors())
app.use(express.json())

const verifytoken = (req, res, next)=>{
  const authHeader = req.headers.authorization;
      if(!authHeader){
          return res.status(401).send({
              message: 'unauthorized access',
          })
      }
      const token = authHeader.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded){
          if(err){
              return res.status(403).send({
                  message: 'Forbidden access',
              })

          }
          req.decoded = decoded;
          next();
      })

}

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_KEY}@cluster0.cvtbcrw.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 }, { connectTimeoutMS: 30000 }, { keepAlive: 1 });

async function dbConnect (){
  try{
    await client.connect();
    console.log('Database Connect')

  }
  catch(error){
    console.log(error);
  }
}
dbConnect();

const allPlaces = client.db('travel-bd').collection('places');
const allReview = client.db('travel-bd').collection('reviews')

app.get('/',(req, res)=>{
  res.send('Server is Connected')
})

app.get('/places', async(req, res) => {
  try{
    const cursor = allPlaces.find({}).sort({_id: -1});
    const places = await cursor.toArray();
    res.send({
      success:true,
      message:"Successfully Got Data",
      data : places
    })

  }
  catch(error){
    res.send({
      success:false,
      error:error.message
    })
  }
})
app.post('/places', async(req, res)=>{
  try{
    const place = req.body;
    const result = await allPlaces.insertOne(place);
    if(result.insertedId){
      res.send({
          success:true,
          message:'Successfully Add Place'
      })
     
  }

  }
  catch(error){
    res.send({
      success:false,
      error:error.message
    })
  }
})
app.get('/place/:id', async(req, res)=>{
  try{
    const {id} = req.params;
    const place = await allPlaces.findOne({_id:ObjectId(id)})

    res.send({
      success:true,
      message:"Find place Successfully !!",
      data: place
    })

  }
  catch(error){
    res.send({
      success:false,
      error: error.message
    })
  }
})
app.post('/review', async(req,res)=>{
  try{
    
    
    const review = await allReview.insertOne(req.body);
    

    if(review.insertedId){
      res.send({
        success:true,
        message:'Successfully Review Add'
      })
    }

  }
  catch(error){
    res.send({
      success:false,
      error:error.message
    })
  }
})
app.get('/review',verifytoken,async(req,res)=>{
  try{
    const decoded = req.decoded;
    
    
    const cursor = allReview.find({}).sort({date_time:-1});
    const review = await cursor.toArray();

    if(!review){
      return;
    }
    else{
      res.send({
        success:true,
        message:"Successfully Got Data",
        data:review
      })
      

    }
    
    const findEmail = review.find(view => view.userEmail === decoded.email)
    console.log(findEmail)
    
        
        if(!findEmail){
            return;

        }
          

        

    

  }
  catch(error){
    res.send({
      success:false,
      error:error.message
    })
  }
})
app.delete('/review/:id',async(req, res)=>{
  const {id} = req.params;
  try{
    
    const query = ({_id:ObjectId(id)});
    const result = await allReview.deleteOne(query)

    if(result.deletedCount){
      res.send({
        success:true,
        message:'Successfully Delete Review'
      })
    }

  }
  catch(error){
    res.send({
      success:false,
      error:error.message
    })
  }
})
app.get('/review/:id',verifytoken,async(req, res)=>{
  try{
    const decoded = req.decoded;
    
    const {id} = req.params;
    const review = await allReview.findOne({_id:ObjectId(id)});
    
        if(review.userEmail !== decoded.email){
            console.log('not find')
            res.status(403).send({
                            message:'unauthoried access'
                        })

        }
    res.send({
      success:true,
      message: "Successfully Find Review",
      data:review
    })

  }
  catch(error){
    res.send({
      success:false,
      error:error.message
    })
  }
})
app.patch('/review/:id', async(req, res)=>{
  const {id} = req.params;
  try{
    
    
    const result = await allReview.updateOne ({_id:ObjectId(id)}, {$set: req.body})
    
    if(result.modifiedCount){
      res.send({
        success:true,
        message:"Successfully Update Review"
      })
    }

  }
  catch(error){
    res.send({
      success:false,
      error:error.message
    })
  }
})
app.post('/jwt', (req, res)=>{
  const user = req.body;
  const token = jwt.sign(user, process.env.ACCESS_TOKEN, {expiresIn: '1d'})
  res.send({
      success:true,
      token:token
  })
})



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})