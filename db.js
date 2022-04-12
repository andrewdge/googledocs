const mongoose = require("mongoose");

module.exports = async function connection() {
  try {
    const connectionParams = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };
    await mongoose.connect(/*`mongodb://admin:password@localhost:27017`*/`mongodb://localhost:27017/doc_users`, connectionParams);
    console.log("connected to database.");
  } catch (error) {
    console.log(error, "could not connect to database.");
  }
};