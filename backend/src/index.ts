import express from "express"

import app from "./app"

// dotenv.config({
//     path:'../.env'
// })


const port = process.env.PORT || 3000

app.listen(port, ()=>{
    console.log('server is running in', port)
})