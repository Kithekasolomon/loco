const Task = require("../models/Task");
const notification = require("../services/notification");

exports.moveTask = async (req, res) => {
  try {
    const { columnId, order, status } = req.body;

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { column: columnId, order, status },
      { new: true }
    ).populate("assignedTo");

    if (task.assignedTo) {
      notification.notifyUser(task.assignedTo._id, "task:statusChanged", {
        taskId: task._id,
        status,
      });
    }

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: "Failed to move task" });
  }
};
