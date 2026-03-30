const express = require("express");
const { Expo } = require("expo-server-sdk");
const db = require("../db/database");
const logger = require("../logger");

const router = express.Router();
const expo = new Expo();

// Simple auth middleware for admin
const requireAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const adminSecret = process.env.ADMIN_SECRET || "default_secret";
  
  if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

router.use(requireAdmin);

// Content Management
router.post("/content", (req, res) => {
  const { key, value } = req.body;
  if (!key || value === undefined) {
    return res.status(400).json({ error: "Missing key or value" });
  }
  
  try {
    db.upsertContent(key, value);
    res.json({ success: true, key, value });
  } catch (err) {
    logger.error("Failed to update content", { error: err.message });
    res.status(500).json({ error: "Failed to update content" });
  }
});

router.get("/content", (req, res) => {
  try {
    const allContent = db.getAllContent();
    res.json(allContent);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch content" });
  }
});

// Push Notifications
router.post("/push", async (req, res) => {
  const { title, body, data } = req.body;
  
  if (!title || !body) {
    return res.status(400).json({ error: "Missing title or body" });
  }

  try {
    const tokensRows = db.getAllPushTokens();
    const pushTokens = tokensRows.map(row => row.token);
    
    let messages = [];
    for (let pushToken of pushTokens) {
      if (!Expo.isExpoPushToken(pushToken)) {
        logger.warn(`Push token ${pushToken} is not a valid Expo push token`);
        continue;
      }
      
      messages.push({
        to: pushToken,
        sound: "default",
        title,
        body,
        data: data || { withSome: "data" },
      });
    }

    let chunks = expo.chunkPushNotifications(messages);
    let tickets = [];
    let errors = [];

    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        logger.error("Failed to send push chunk", { error: error.message });
        errors.push(error.message);
      }
    }
    
    res.json({ 
      success: true, 
      sent: messages.length, 
      tickets,
      errors: errors.length > 0 ? errors : undefined 
    });
    
  } catch (err) {
    logger.error("Failed to broadcast push notification", { error: err.message });
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Dashboard Stats
router.get("/stats", (req, res) => {
  try {
    const tokensCount = db.getAllPushTokens().length;
    res.json({
      pushTokens: tokensCount,
      timestamp: new Date().toISOString()
    });
  } catch(err) {
    res.status(500).json({ error: "Failed to get stats" });
  }
})

module.exports = router;
