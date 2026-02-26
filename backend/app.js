const express = require("express");
const connectDB = require("./db");
const routes = require("./router/musicRouter");
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use("/album", routes);

connectDB();

app.listen(4000, (req, resp) => {
  console.log("running");
});
