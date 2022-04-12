const mongoose = require("mongoose");

module.exports = async function connection() {
  try {
    const uri = "mongodb+srv://andrew:andrewge@cluster0.f9prs.mongodb.net/main?retryWrites=true&w=majority";
    const connectionParams = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };
    await mongoose.connect(/*`mongodb://admin:password@localhost:27017`*/uri, connectionParams);
    console.log("connected to database.");
  } catch (error) {
    console.log(error, "could not connect to database.");
  }
};