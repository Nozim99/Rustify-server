const mongoose = require("mongoose");
const router = require("express").Router();
const login = require("../middleware/login");
const { User } = require("../models/User");

// friends ro'yhatini jo'natadi
router.get("/getfriends", login, (req, res) => {

  User.findById(req.user._id)
    .populate("friends", "_id, name")
    .then((result) => {
      res.send(result.friends);
    })
    .catch((err) => {
      throw err;
    });
});

// friends bo'lishga so'rov yuboradi 
router.put("/addfriend", login, async (req, res) => {
  User.findById(req.body._id)
    .then(async (result) => {
      let userF = await User.findById(req.user._id)
      let followerF = await User.findById(req.body._id)

      if (userF.friends.includes(req.body._id))
        return res.status(400).json({ error: `You cannot send a request. because ${followerF.name} is in the friends list` });


      let followed;

      if (result.following.includes(req.user._id)) {
        followed = true
      }

      // Do'stlik so'rovini yuborgan userni following ro'yhatida o'zini id raqami bo'lsa
      // ikkalasini ham friends ro'yhatiga bir-birini id raqami saqlanadi
      if (followed) {

        // ikkalasini ham friends ro'yhatiga bir-birini id raqami saqlanadi
        userF.friends.push(req.body._id)
        followerF.friends.push(req.user._id)

        // userni followers ro'yhatidan 2-tomonni id raqami o'chiriladi
        const idx = userF.followers.indexOf(req.body._id)

        // 2-tomonni following ro'yhatidan user id raqami o'chiriladi
        const index = followerF.following.indexOf(req.user._id)

        // agar idx va index raqami topilmasa xatolik qaytaradi
        if (index < 0 || idx < 0) return res.status(400).json({ error: "The requested user has canceled your friend request" })

        userF.followers.splice(idx, 1)
        followerF.following.splice(index, 1)

        await userF.save()
        await followerF.save()

        return res.json({ user: userF, follower: followerF })
      }

      let user = await User.findById(req.user._id)
      let follower = await User.findById(req.body._id)

      // user'ni following ro'yhatida 2-tomonni id raqami mavjud bo'lmasa saqlanadi
      if (!user.following.includes(req.body._id)) {
        user.following.push(req.body._id)
      }

      // 2-tomonni followers ro'yhatida user'ni id raqami mavjud bo'lmasa qo'shadi
      if (!follower.followers.includes(req.user._id)) {
        follower.followers.push(req.user._id)
      }

      await user.save()
      await follower.save()

      user.password = undefined
      follower.password = undefined

      return res.json({ user, follower })
    })
    .catch(error => res.status(500).json(error))
});

// so'rovni bekor qilish
router.put("/deleterequest", login, async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, { $pull: { following: req.body._id } }, { new: true }).select("-password")
  const follower = await User.findByIdAndUpdate(req.body._id, { $pull: { followers: req.user._id } }, { new: true }).select("-password")

  return res.json({ user, follower })
});

// so'rov yuborganni followers ro'yhatidan id raqamini o'chirish
router.put("deleteclaimant", login, async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, { $pull: { followers: req.body._id } }, { new: true }).select("-password")
  const follower = await User.findByIdAndUpdate(req.body._id, { $pull: { following: req.user._id } }, { new: true }).select("-password")

  return res.json({ user, follower })
})

// friends'ni tasdiqlash
router.put("/confirmfriend", login, async (req, res) => {
  // user'ni friends ro'yhatiga qo'shadi va followers ro'yhatidan o'chiriladi
  const user = await User.findByIdAndUpdate(req.user._id, { $addToSet: { friends: req.body._id }, $pull: { followers: req.body._id } }, { new: true }).select("-password")

  // 2-tomonni friends ro'yhatiga qo'shadi va following ro'yhatidan o'chiriladi
  const follower = await User.findByIdAndUpdate(req.body._id, { $addToSet: { friends: req.user._id }, $pull: { following: req.user._id } }, { new: true }).select("-password")

  return res.json({ user, follower })
});

// friends'ni o'chirish
router.put("/deletefriend", login, async (req, res) => {
  // user'ni friends ro'yhatidan 2-tomon id raqami o'chiriladi
  const user = await User.findByIdAndUpdate(req.user._id, { $pull: { friends: req.body._id } }, { new: true }).select("-password")

  // 2-tomonni friends ro'yhatidan user'ni id raqami o'chiriladi
  const follower = await User.findByIdAndUpdate(req.body._id, { $pull: { friends: req.user._id } }, { new: true }).select("-password")

  return res.json({ user, follower })
});

module.exports = router;
