import mongoose from "mongoose";

const connectDB = async () => {
    await mongoose.connect(`${process.env.MONGODB_URI}/chat-app`)
        .then(() => console.log("DB Connected!!"))
        .catch(err => console.log("error:" + err));

}

export {
    connectDB
};