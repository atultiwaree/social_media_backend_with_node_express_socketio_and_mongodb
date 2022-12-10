const { msgConstants } = require("../helper/msgConstants");
const utils = require("../helper/utils");
const { postsModel } = require("../models/post.model");
const { commentModel } = require("../models/comment.model");
const { likeModel } = require("../models/like.model");
const { reportModel } = require("../models/report.model");
const { blockUserModel } = require("../models/blockuser.model");

module.exports.createPost = async (req, res) => {
  let object = Object.assign({});
  let fileTypeError = false;
  if (!req.body.title) return res.json(utils.createErrorResponse(msgConstants.titleRequired));
  object["title"] = req.body?.title;
  object["description"] = req.body?.description;
  object["userId"] = object["user"] = req.user._id;
  if (req.files?.length > 0) {
    if (req.files?.length > 5) return res.json(utils.createErrorResponse(msgConstants.numberOfPostImage));
    else
      object["media"] = req.files.map((x) => ({
        url: String(x.path).toLowerCase(),
        type: x.mimetype.includes("image") ? "image" : x.mimetype.includes("video") ? "video" : (fileTypeError = true),
      }));
  }
  if (!fileTypeError) {
    await postsModel(object).save();
    return res.json(utils.createSuccessResponse(msgConstants.postCreated));
  } else return res.json(utils.createErrorResponse(msgConstants.allowedOnlyVideoOrImage));
};

module.exports.deletePost = async (req, res) => {
  if (utils.isValidObjectId(req.params.id)) {
    const postPresence = await postsModel.findOne({ $and: [{ _id: req.params.id }, { userId: req.user._id }] });
    if (postPresence) {
      await postPresence.remove();
      return res.json(utils.createSuccessResponse(msgConstants.deletedPostSuccessfully));
    } else return res.json(utils.createErrorResponse(msgConstants.postNotExist));
  } else return res.json(utils.createErrorResponse(msgConstants.falseValidId));
};

module.exports.postList = async (req, res) => {
  let postsLists = await postsModel
    .find({ active: true })
    .select("title description media blockIt")
    .populate("user", "name profile _id")
    .lean();

  const userLikedLikeList = await likeModel.find({ userId: { $in: [`${req.user._id}`] } });

  const postIdArrays = postsLists.map((posts) => posts._id.toString());

  const postInCommentCollection = await commentModel.find({ postId: { $in: postIdArrays } });

  const postInLikesCollection = await likeModel.find({ id: { $in: postIdArrays } });

  /*
    "::::::::::::::::::::REPORT SECTION":::::::::::::::::::::"  
    If Reported -> true -> find repoted post -> delete that post from postsList
    If Reported -> false -> Normally show All the posts
    If admin of post blocked user watching post he she should not list that particular post.
  */

  const reportedPostList = await reportModel.find();
  const blockedUserArray = await blockUserModel.find().select("-_id");

  for (const posts of postsLists) {
    let index = blockedUserArray.findIndex((bu) => {
      return posts.user._id.toString() === bu.userId.toString() && bu.blockedUserId.toString() === req.user._id.toString();
    });
    delete postsLists[index];
    postsLists = postsLists.filter(Boolean);
  }

  let isUserReported = reportedPostList.findIndex((post) => post.userId.toString() === req.user._id.toString());

  if (isUserReported >= 0) {
    for (const blockedPost of reportedPostList) {
      let indexOfBlockedPost = postsLists.findIndex((post) => post?._id.toString() === blockedPost.postId.toString());
      delete postsLists[indexOfBlockedPost];
    }

    return res.json(utils.createSuccessResponse(msgConstants.listAllPost, postsLists.filter(Boolean)));
  } else {
    for (const singlePost of postsLists) {
      let commentsCount = postInCommentCollection.filter(
        (commentsDocs) => commentsDocs.postId.toString() === singlePost._id.toString()
      ).length;
      singlePost["Total Comments"] = commentsCount;

      let likesCount = postInLikesCollection.filter((likeDocs) => likeDocs.id.toString() === singlePost._id.toString()).length;
      singlePost["Total Likes"] = likesCount;

      let ifLiked = userLikedLikeList.filter((likeDocs) => likeDocs.id.toString() === singlePost._id.toString()).length;
      if (ifLiked > 0) singlePost["Liked"] = true;
      else singlePost["Liked"] = false;
    }
    return res.json(utils.createSuccessResponse(msgConstants.listAllPost, postsLists));
  }
};

module.exports.postDetails = async (req, res) => {
  if (utils.isValidObjectId(req.params.id)) {
    const postDetails = await postsModel
      .findOne({ _id: req.params.id })
      .select(" userId title description media -_id")
      .populate("user", "name age _id")
      .lean();
    const userBlocked = await blockUserModel.findOne({ userId: postDetails["userId"], blockedUserId: req.user._id });
    if (!userBlocked) {
      const notReported = await reportModel.findOne({ postId: req.params.id, userId: req.user._id });
      if (!notReported) {
        if (postDetails) {
          postDetails["Total_comments"] = await commentModel.count({ postId: req.params.id });
          postDetails["Total_likes"] = await likeModel.count({ id: req.params.id });
          const liked = await likeModel.findOne({ $and: [{ id: req.params.id }, { userId: req.user._id }] });
          if (liked) {
            postDetails["Liked"] = true;
          } else postDetails["Liked"] = false;
          return res.json(utils.createSuccessResponse(msgConstants.postDescription, postDetails));
        } else return res.json(utils.createErrorResponse(msgConstants.noPostFound));
      } else return res.json(utils.createErrorResponse(msgConstants.noPostFound));
    } else return res.json(utils.createErrorResponse("User Blocked"));
  } else return res.json(utils.createErrorResponse(msgConstants.falseValidId));
};

module.exports.updatePost = async (req, res) => {
  if (utils.isValidObjectId(req.body.postId)) {
    const post = await postsModel.findOne({ userId: req.user._id, _id: req.body.postId });

    if (post) {
      for (const i of ["title", "description"]) if (req.body[i]) post[i] = req.body[i];

      let deleteArray = utils.parseToJson(req.body.delete);

      if (deleteArray && deleteArray.length > 0) {
        for (const i of deleteArray) {
          const index = post["media"].findIndex((x) => x._id.toString() == i.toString());
          delete post["media"][index];
        }

        post["media"] = post["media"].filter(Boolean);
      }

      if (req.files?.length > 0) {
        if (post["media"].length + req.files.length < 6)
          req.files.map((x) => post["media"].push({ url: x.path, type: x.mimetype.includes("image") ? "image" : "video" }));

        await post.save();
        return res.json(utils.createSuccessResponse(msgConstants.successfullyUpdatedPost, post));
      } else return res.json(utils.createErrorResponse(msgConstants.limitExceed));
    } else return res.json(utils.createErrorResponse(msgConstants.noPostFound));
  } else return res.json(utils.createErrorResponse(msgConstants.invalidPostId));
};

module.exports.postComment = async (req, res) => {
  const commentData = Object.assign({});
  if (!req.body.postId) return res.json(utils.createErrorResponse(msgConstants.providePostId));
  if (!utils.isValidObjectId(req.body.postId)) return res.json(utils.createErrorResponse(msgConstants.somethingWentWrong));
  //Post id was incorrect basically I've written according to end user
  const postPresence = await postsModel.findOne({ _id: req.body.postId });
  if (postPresence) {
    const userBlocked = await blockUserModel.findOne({ userId: postPresence["userId"], blockedUserId: req.user._id });

    if (!userBlocked) {
      const notReported = await reportModel.findOne({ postId: req.body.postId, userId: req.user._id });

      if (!notReported) {
        for (const i of ["postId", "comment"]) {
          if (!req.body[i]) return res.json(utils.createErrorResponse(`${i} is required field`));
          else commentData[i] = req.body[i];
        }
        commentData["userId"] = commentData["user"] = req.user._id;

        await commentModel(commentData).save();
        //Updating totalComments Count
        postPresence["commentsCount"] += 1;
        await postPresence.save();
        return res.json(utils.createSuccessResponse(msgConstants.commentPosted));
      } else return res.json(utils.createErrorResponse(msgConstants.postNotExist));
    } else return res.json(utils.createErrorResponse("blocked user"));
  } else return res.json(utils.createErrorResponse(msgConstants.postIsNotPresent));
};

module.exports.like = async (req, res) => {
  if (utils.isValidObjectId(req.params.id)) {
    const isPostIdTrue = await postsModel.findById({ _id: req.params.id });

    if (isPostIdTrue) {
      const userBlocked = await blockUserModel.findOne({ userId: isPostIdTrue["userId"], blockedUserId: req.user._id });

      if (!userBlocked) {
        const postReported = await reportModel.findOne({ postId: req.params.id, userId: req.user._id });
        if (!postReported) {
          const exist = await likeModel.findOne({ $and: [{ id: req.params.id }, { userId: req.user._id }] });
          if (exist) {
            if (isPostIdTrue["likesCount"] != 0) isPostIdTrue["likesCount"] -= 1;
            await isPostIdTrue.save();
            await exist.remove();
            return res.json(utils.createSuccessResponse(msgConstants.postDisliked));
          } else {
            isPostIdTrue["likesCount"] += 1;
            await isPostIdTrue.save();
            await likeModel({ id: req.params.id, userId: req.user._id, user: req.user._id }).save();
            return res.json(utils.createSuccessResponse(msgConstants.postLiked));
          }
        } else return res.json(utils.createErrorResponse(msgConstants.postNotExist));
      } else return res.json(utils.createErrorResponse("User blocked"));
    } else return res.json(utils.createErrorResponse(msgConstants.postNotExist));
  } else return res.json(utils.createErrorResponse(msgConstants.falseValidId));
};

module.exports.getComments = async (req, res) => {
  if (utils.isValidObjectId(req.params.id)) {
    const postExist = await postsModel.findOne({ _id: req.params.id });
    if (postExist) {
      const userBlocked = await blockUserModel.findOne({ userId: postExist["userId"], blockedUserId: req.user._id });
      if (!userBlocked) {
        const postReported = await reportModel.findOne({ postId: req.params.id, userId: req.user._id });
        if (!postReported) {
          const postNotBlocked = await reportModel.findOne({ postId: req.params.id, userId: req.user._id });
          if (!postNotBlocked) {
            const commentData = await commentModel
              .find({ postId: req.params.id, active: true })
              .select("comment -_id")
              .populate("user", "name _id");
            return res.json(utils.createSuccessResponse(msgConstants.commentData, commentData));
          } else return res.json(utils.createErrorResponse(msgConstants.errorRetrivalComment));
        } else return res.json(utils.createErrorResponse(msgConstants.postNotExist));
      } else return res.json(utils.createErrorResponse("user is blocked"));
    } else return res.json(utils.createErrorResponse(msgConstants.postNotExist));
  } else return res.json(utils.createErrorResponse(msgConstants.falseValidId));
};

module.exports.getLikes = async (req, res) => {
  if (utils.isValidObjectId(req.params.id)) {
    const postExist = await postsModel.findOne({ _id: req.params.id });
    const postReported = await reportModel.findOne({ postId: req.params.id, userId: req.user._id });
    if (!postReported) {
      if (postExist) {
        const userBlocked = await blockUserModel.findOne({ userId: postExist["userId"], blockedUserId: req.user._id });
        if (!userBlocked) {
          const likeData = await likeModel
            .find({ id: req.params.id, active: true })
            .select("-_id -id -userId")
            .populate("user", "name _id");
          return res.json(utils.createSuccessResponse(msgConstants.likeData, likeData));
        } else return res.json(utils.createErrorResponse("user is blocked"));
      } else return res.json(utils.createErrorResponse(msgConstants.postNotExist));
    } else return res.json(utils.createErrorResponse(msgConstants.postNotExist));
  } else return res.json(utils.createErrorResponse(msgConstants.falseValidId));
};

module.exports.report = async (req, res) => {
  if (req.body.postId) {
    if (utils.isValidObjectId(req.body.postId)) {
      const isPostPresent = await postsModel.findOne({ _id: req.body.postId });
      if (isPostPresent) {
        const alreadyReported = await reportModel.findOne({ postId: req.body.postId, userId: req.user._id });
        if (!alreadyReported) {
          const userBlocked = await blockUserModel.findOne({ userId: isPostPresent["userId"], blockedUserId: req.user._id });
          if (!userBlocked) {
            let reportObject = Object.assign({});
            reportObject["userId"] = req.user._id;
            reportObject["postId"] = req.body.postId;
            reportObject["reportMessage"] = req.body.message;
            await reportModel(reportObject).save();
            return res.json(utils.createSuccessResponse(msgConstants.reportSubmitted));
          } else return res.json(utils.createErrorResponse("user is blocked"));
        } else return res.json(utils.createErrorResponse(msgConstants.alreadyReported));
      } else return res.json(utils.createErrorResponse(msgConstants.postNotExist));
    } else return res.json(utils.createErrorResponse(msgConstants.invalidPostId));
  } else return res.json(utils.createErrorResponse(msgConstants.postIdIsRequired));
};

module.exports.share = async (req, res) => {
  if (utils.isValidObjectId(req.params.id)) {
    const postExist = await postsModel.findOne({ _id: req.params.id });
    if (postExist) {
      await postsModel({ shared: req.params.id, userId: req.user._id, user: req.user._id }).save();
      return res.json(utils.createSuccessResponse(msgConstants.postShared));
    } else return res.json(utils.createErrorResponse(msgConstants.postNotExist));
  } else return res.json(utils.createErrorResponse(msgConstants.invalidId));
};

module.exports.timeLine = async (req, res) => {
  const postList = await postsModel
    .find({ userId: req.user._id })
    .populate({
      path: "shared",
      select: "-createdAt -updatedAt -__v -active -_id -shared",
      populate: {
        path: "user",
        select: "name title description media",
      },
    })
    .populate("user title description", "name -_id")
    .select("name");
  if (postList) {
    return res.json(utils.createSuccessResponse("All Post", postList));
  } else return res.json(utils.createErrorResponse([]));
};
