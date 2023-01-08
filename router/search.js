const router = require("express").Router();
const { User } = require("../models/User");

// userlar ro'yhatini yuboradi
router.get("/" , (req, res)=>{

  // name va _id ma'lumotini yuboradi
  User.find()
  .select("name _id")
  .then(result=>{
    res.json({data: result})
  })
})

// user qidirish
router.get("/find-user", (req, res) => {
  const { player } = req.body

  // player ma'lumotini tekshiradi
  if (!player) return res.status(400).json({ error: "input is empy" })

  User.find({ name: player })
  .then(data=>{
    res.json({data})
  })
})

// test
router.get("/test", (req, res) => {
  res.json(req.query)
})

module.exports = router;