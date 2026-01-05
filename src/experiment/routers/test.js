import express from 'express'

const router = express.Router();

router.get("/", (req,res) => {
    res.send("You hit the home")
 })

 export default router;