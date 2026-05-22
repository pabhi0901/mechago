import mongoose from "mongoose";

async function connectToDatabase() {

    try{
        await mongoose.connect(process.env.MONGO_URI)
        console.log("Connected to MongoDB");
    }
    catch(error){
        console.error("Error connecting to MongoDB:", error);
        console.log("Retrying in 3 seconds...");
        setTimeout(connectToDatabase, 3000);
    }

}

export default connectToDatabase;