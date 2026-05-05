import mongoose from "mongoose";

const connectDB = async () => {
  //   mongoose.connection.on("connection", () => {
  //     console.log("Database connected");
  //   });
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database Connected");
  } catch (error) {
    console.log("Error connecting to MongoDb", error.message);
  }
};

export default connectDB;
