// controllers/commentController.js
const Comment = require("../models/Comment");
const Notification = require("../models/Notification");
const notification = require("../services/notification");

exports.createComment = async (req, res) => {
  try {
    const { text, mentions } = req.body;

    const comment = await Comment.create({
      task: req.params.taskId,
      user: req.user.id,
      text,
      mentions,
    });

    // 🔔 notify mentioned users
    for (const userId of mentions || []) {
      await Notification.create({
        user: userId,
        type: "MENTION",
        message: "You were mentioned in a comment",
        relatedTask: req.params.taskId,
      });

      notification.notifyUser(userId, "notification:new", {
        type: "MENTION",
        taskId: req.params.taskId,
      });
    }

    res.json(comment);
  } catch (err) {
    res.status(500).json({ message: "Failed to add comment" });
  }
};
