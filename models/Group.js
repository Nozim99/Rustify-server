const mongoose = require("mongoose")
const { ObjectId } = mongoose.Schema.Types
const Joi = require("joi")

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    minLength: 3,
    maxLength: 120
  },
  createdBy: {
    type: ObjectId,
    ref: "User"
  },
  friends: [
    {
      id: {
        type: ObjectId,
        ref: "User",
      },
      status: {
        type: String,
        default: "player"
      }
    }
  ]
})
const Group = mongoose.model("Group", groupSchema)

function validate(group) {
  const schema = Joi.object({
    name: Joi.string().required().min(3).max(120)
  })

  return schema.validate(group)
}

exports.Group = Group
exports.validate = validate