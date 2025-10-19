import express from "express";
import cors from "cors";

import errorHandler from "./middlewares/error.middleware";

const app = express();

// common middlewares
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);

// to handle json data and form data
app.use(express.json())
app.use(express.urlencoded({extended:true}))


// routes
app.get('/api/v1/healthcheck', (req,res)=>{
    res.status(200).json({
        status:"success",
        message:"API is working fine"
    })
})
// app.post('/api/v1/former', )

app.use(errorHandler)
export default app