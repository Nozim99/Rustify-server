const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../keys");
const mongoose = require("mongoose");
const { User } = require("../models/User");

module.exports = (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization)
    return res.status(401).json({ error: "Need to register" });

  const mezes = authorization.slice(0, 6);
  if (mezes !== "MEZES ")
    return res.status(401).json({ error: "invalid token" });
  const token = authorization.replace("MEZES ", "");

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) return res.status(401).json({ error: err });
    const { _id } = payload;
    User.findById(_id).then((userData) => {
      // console.log(userData);
      req.user = userData
      next();
    });
  });
};

// const token = req.header('x-auth-token');
// if (!token)
//   return res.status(401).json({ error: "Need to register" })

// try {
//   const decoded = jwt.verify(token, JWT_SECRET)
//   req.user = decoded
//   next()
// } catch (ex) {
//   return res.status(400).send("Invalid token")
// }
