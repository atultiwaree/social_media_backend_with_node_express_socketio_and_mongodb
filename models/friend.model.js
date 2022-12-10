const mongoose = require("mongoose");
const friendRequest = mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  senderDetails: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  sentTo: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  sentToUserDetails: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  accepted: {
    type: Boolean,
    default: false,
  },

  active: {
    type: Boolean,
    default: true,
  },
});

const friendRequestModel = mongoose.model("Friendrequest", friendRequest);
module.exports = { friendRequestModel };
