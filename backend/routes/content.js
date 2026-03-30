const express = require("express");
const db = require("../db/database");

const router = express.Router();

router.get("/", (req, res) => {
  try {
    const allContent = db.getAllContent();
    // Convert array to object
    const contentMap = {};
    allContent.forEach((item) => {
      contentMap[item.key] = item.value;
    });
    res.json(contentMap);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch content" });
  }
});

router.get("/:key", (req, res) => {
  try {
    const value = db.getContent(req.params.key);
    if (value === null) {
      return res.status(404).json({ error: "Not found" });
    }
    res.json({ key: req.params.key, value });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch content block" });
  }
});

module.exports = router;
