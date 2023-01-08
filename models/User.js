const mongoose = require("mongoose")
const Joi = require("joi")

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true,
    minLength: 3,
    maxLength: 60
  },
  password: {
    type: String,
    required: true,
    minLength: 3,
    maxLength: 120
  },
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }]
})

function validate(user) {
  const schema = Joi.object({
    name: Joi.string().required().min(3).max(60),
    password: Joi.string().required().min(3).max(120)
  })

  return schema.validate(user)
}

const User = mongoose.model("User", userSchema)

exports.User = User
exports.validUser = validate