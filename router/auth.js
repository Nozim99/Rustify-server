const router = require("express").Router()
const jwt = require("jsonwebtoken")
const { User, validUser } = require("../models/User")
const bcrypt = require("bcryptjs")

const { JWT_SECRET } = require("../keys")

// SIGNUP
router.post("/signup", (req, res) => {
  const { name, password } = req.body

  if (!name)
    return res.status(422).json({ error: "must enter a name" })

  if (!password)
    return res.status(422).json({ error: "must enter a password" })

  const { error } = validUser(req.body)
  if (error)
    return res.status(422).json({ error })

  // name'ni shriftini katta va kichikligini hisobga omidi
  User.findOne({ name: { $regex: name, $options: 'i' } })
    .then(saveUser => {
      if (saveUser)
        return res.status(422).json({ error: "this username exists" })

      // parolni hash'laydi
      bcrypt.hash(password, 10)
        .then(hashPas => {
          const user = new User({
            name,
            password: hashPas
          })

          user.save()
            .then((user) => {
              const token = jwt.sign({ _id: user._id }, JWT_SECRET)
              return res.json({ msg: "Ro'yhatdan o'tildi", user, token })
            })
            .catch(err => {
              console.log(err);
              return res.json(err)
            })
        })
    })

})

// SIGNIN
router.post("/signin", (req, res) => {
  const { name, password } = req.body

  if (!name)
    return res.status(422).json({ error: "must enter a name" })

  if (!password)
    return res.status(422).json({ error: "must enter a password" })

  // name'ni shriftini katta va kichikligini hisobga omidi
  User.findOne({ name: { $regex: name, $options: "i" } })
    .then(saveUser => {
      // name value'si bazada bo'lmasa hato qaytaradi
      if (!saveUser)
        return res.status(422).json({ error: "Name is wrong" })

      // kiritilgan parolni hash'langan parol bilan solishtiradi
      bcrypt.compare(password, saveUser.password)
        .then(doMatch => {
          if (!doMatch)
            return res.status(422).json({ error: "Password is wrong" })

          // Parol to'g'ri kiritilgan bo'lsa token'ni payload'iga user _id ma'lumoti saqlanib yuboriladi
          const token = jwt.sign({ _id: saveUser._id }, JWT_SECRET)
          res.json({ token })
        })
        .catch(err => {
          throw err
        })
    })
})

module.exports = router