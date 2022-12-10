const mongoose = require("mongoose");
const postsSchema = mongoose.Schema(
  {
    userId: {
      type: String,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    title: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      default: null,
    },
    media: [
      {
        type: {
          type: String,
          default: null,
        },
        url: {
          type: String,
          default: null,
        },
      },
    ],
    likes: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Likes",
    },
    active: {
      type: Boolean,
      default: true,
    },
    shared: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Posts",
      default: null,
    },
  },
  { timestamps: true }
);

const postsModel = mongoose.model("Posts", postsSchema);
module.exports = { postsModel };
