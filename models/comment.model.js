const mongoose = require("mongoose");
const utils = require("../helper/utils");

const commentSchema = mongoose.Schema({
  postId: {
    type: utils.idOfType(),
  },
  userId: {
    type: utils.idOfType(),
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  comment: {
    type: String,
  },
  active: {
    type: Boolean,
    default: true,
  },
});

const commentModel = mongoose.model("Comments", commentSchema);

module.exports = { commentModel };
