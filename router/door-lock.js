const router = require("express").Router()
const { User } = require("../models/User")
const { Group, validate } = require("../models/Group")
const login = require("../middleware/login")

// get groups list
router.get("/groups", login, async (req, res) => {
  // userga tegish goup'larni qaytaradi
  const myGroups = await Group.find({ createdBy: req.user._id })

  // boshqalarga a'zo group'larni qaytaradi
  const otherGroups = await Group.find({ friends: req.user._id })

  return res.json({ myGroups, otherGroups })
})

// group yaratish
router.post("/create", login, (req, res) => {
  if (!req.body.name)
    return res.status(422).json({ error: "Enter a name for the group" })

  const { error } = validate(req.body)
  if (error) return res.status(401).json(error)

  const group = new Group({
    name: req.body.name,
    createdBy: req.user._id
  })

  Group.find({ createdBy: req.user._id })
    .then(result => {
      // group'lar soni 10 tadan ko'p bo'lsa hatolik qaytaradi
      if (result.length >= 10) return res.status(401).json({ error: "it is not possible to open more than 10 groups" })

      // group name is unique
      for (let el of result) {
        if (el.name == req.body.name) {
          return res.status(400).json({ error: "There is a group with this name" });
        }
      }

      group.save()
        .then(result => {
          return res.json({ group: result })
        })
        .catch(error => {
          return res.status(400).json(error)
        })
    })
    .catch(error => {
      return res.status(401).json(error)
    })
})

// group o'chirish
router.delete("/delete", login, (req, res) => {
  Group.findById(req.body._id)
    .then(gr => {
      if (!gr) return res.status(400).json({ error: "This group was not found" })
      if (gr.createdBy.toString() !== req.user._id.toString()) return res.status(400).json({ error: "You don't delete a group created by another user" })

      Group.findByIdAndRemove(req.body._id)
        .then(result => res.json(result))
        .catch(error => res.status(400).json(error))
    })
})

// group'ga odam qo'shish
router.put("/addplayer", login, (req, res) => {
  User.findById(req.user._id)
    .then(async () => {
      // firends ro'yhatida ushbu user bo'lmasa uni guruhga qo'shaolmaydi
      // if (!result.friends.includes(req.body.player)) return res.status(400).json({ error: "This user is not in your friends list" })

      let group = await Group.findById(req.body._id)

      let owner;
      let lider;

      // grupani yaratuvchisi bo'lsa owner'ga saqlaydi
      if (group.createdBy.toString() === req.user._id.toString()) { owner = req.user._id.toString() }

      // guruhga a'zo odam bo'lsa lider containeriga saqlanadi
      for (let i of group.friends) {
        if (i._id.equals(req.user._id)) {
          lider = i;
          break;
        }
      }

      // guruhga aloqasi borligi aniqlanadi
      if (!owner && !lider) return res.status(400).json({ error: "You are not connected to this group" })

      // agar guruh egasi yoki statusi lider bo'lmasa guruhga odam qo'shaolmaydi
      if (!owner && !lider.status !== "lider") return res.status(400).json({ error: "You cannot add players to this group" })

      // bitta group'da ishtirokchilar soni group'ni yaratgan user bilan ham ko'pida 100 ta bo'ladi
      if (group.friends.length >= 99) return res.status(400).json({ error: "The number of players in one group should not exceed 100" })

      // Bir playerni group'ga faqat bir marta qo'shaoladi
      for (let i of group.friends) {
        if (i._id.toString() === req.body.player) return res.status(400).json({ error: "this player is available" })
      }

      // guruhni friends ro'yhatiga guruh egasi qo'shilmaydi
      if (group.createdBy.toString() === req.body.player.toString()) return res.status(400).json({ error: "This user is the owner of the group" })

      group.friends.push(req.body.player)
      await group.save()
        .then(el => {
          res.json(el)
        })
        .catch(error => {
          res.json(error)
        })
    })
    .catch(error => res.status(500).json(error))
})

// guruh a'zosi statusini o'zgartirish
router.put("/status", login, (req, res) => {
  User.findById(req.user._id)
    .then(async (result) => {

      // body ma'lumoti to'g'ri to'ldirilgani tekshiriladi
      const { group_id, player, status } = req.body
      if (!group_id || !player) return res.status(500).json({ error: "Server error, try later" })
      if (!status) return res.status(400).json({ error: "Enter a status" })
      if (status !== "lider" && status !== "player") return res.status(400).json({ error: "status name is invalid" })

      // user account'i topilmasa
      if (!result) return res.status(401).json({ error: "Your account was not found" })

      const group = await Group.findById(group_id)

      // guruhni egasiligi tekshiriladi
      if (!group.createdBy.equals(req.user._id)) return res.status(400).json({ error: "Only the group owner can change the status" })

      // player guruhda mavjudligi tekshiriladi
      let groupPlayer = false;
      for (let i of group.friends) {
        if (i._id.equals(player)) {
          groupPlayer = true;
          break;
        }
      }
      if (!groupPlayer) return res.status(400).json({ error: "This user is not a member of the group" })

      // playerni statusi o'zgaradi
      const user = group.friends.find(e => e._id.equals(player))
      user.status = status

      await group.save()
        .then(() => {
          res.json({ result: status })
        })
        .catch(error => {
          res.status(500).json(error)
        })
    })
    .catch(error => {
      res.status(500).json(error)
    })
})

// guruh a'zoligidan bekor qilish
router.delete("/status", login, async (req, res) => {

  // req.body'ni tekshiriladi
  const { group_id, player } = req.body
  if (!group_id || !player) return res.status(400).json({ error: "Bad response" })

  let group = await Group.findById(group_id)

  // guruh egasiligi aniqlanadi
  if (!group.createdBy.equals(req.user._id)) return res.status(400).json({ error: "Only the group owner can delete player from the group" })

  // playerni o'chirish
  const deleted = group.friends.filter(e => {
    return e._id.toString() !== player.toString()
  })

  group.friends = deleted;

  await group.save()
    .then(() => {
      res.json(deleted)
    })
    .catch(error => {
      res.status(500).json(error)
    })

})

module.exports = router