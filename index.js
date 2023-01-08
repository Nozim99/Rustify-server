const mongoose = require("mongoose")
const express = require("express")
const app = express()
mongoose.set("strictQuery", false)
mongoose.connect("mongodb://localhost/rust", { family: 4 })

app.use(express.json())

app.use("/door-lock", require("./router/door-lock"))
app.use("/friends", require("./router/friends"))
app.use("/account", require("./router/auth"))
app.use("/search", require('./router/search'))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server has been started on port ${PORT}`);
})