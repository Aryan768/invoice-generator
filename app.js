import express from 'express';
const app= express();
const PORT = process.env.PORT||6000 ;
app.listen(PORT,(req,res)=>{
    console.log(`App is listening on port ${PORT}`);
})