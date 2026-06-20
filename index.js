import "dotenv/config";
import app from "./app.js";


const PORT = process.env.PORT 
app.listen(process.env.PORT, ()=>{
    console.log(`Server Connected Successflly on port ${PORT}`);
});


