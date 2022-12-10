const sendMail = require("../mail/index.js");
const { regModel } = require("../models/regModel.js");
const utils = require("../helper/utils");
const { msgConstants } = require("../helper/msgConstants");
const mailBody = require("../html/email.body");
const { friendRequestModel } = require("../models/friend.model.js");
const { commentModel } = require("../models/comment.model.js");
const { likeModel } = require("../models/like.model.js");
const { postsModel } = require("../models/post.model.js");
const { reportModel } = require("../models/report.model.js");
const { blockUserModel } = require("../models/blockuser.model.js");
const { messageModel } = require("../models/message.model.js");

const registerController = async (req, res) => {
  let updateObject = Object.assign({});

  for (const i of ["email", "password", "name", "dob"]) {
    if (!req.body[i]) return res.json({ success: false, msg: `Please Enter ${i}` });
    else updateObject[i] = req.body[i];
  }

  if (!utils.validateEmail(`${req.body.email}`)) return res.json(utils.createErrorResponse(msgConstants.notValidEmail));
  if (req.files?.length > 1) return res.json(utils.createErrorResponse(msgConstants.onlySinglePictureIsRequired));

  const emailExist = await regModel.findOne({
    email: req.body.email.toLowerCase(),
  });

  if (!emailExist) {
    updateObject["password"] = utils.hashPassword(req.body["password"]);
    updateObject["profile"] = req.files?.path;

    const user = await regModel(updateObject).save();

    if (user) {
      sendMail(user.email, "Deft Social Account verification", mailBody.vfMail(user._id, "Click to verify"));
      return res.json(utils.createSuccessResponse(msgConstants.userRegistered));
    } else return res.json(utils.createErrorResponse(msgConstants.userNotRegistered)).status(400);
  } else return res.json(utils.createErrorResponse(msgConstants.emailAlreadyExist)).status(400);
};

const verifyController = async (req, res) => {
  if (!req.params.id) return res.json({ success: false, msg: "Id not on params" }).status(400);
  regModel
    .updateOne({ _id: req.params.id }, { verified: true, active: true })
    .then(() => {
      return res.json(utils.createSuccessResponse(msgConstants.accountVerified)).status(200);
    })
    .catch((err) => {
      return res.json({ success: false, error: err.message });
    });
};

const loginController = async (req, res) => {
  for (const i of ["email", "password", "deviceId", "deviceModel"])
    if (!req.body[i]) return res.json({ success: false, msg: `Provide ${i}` });

  if (!utils.validateEmail(`${req.body.email}`)) return res.json(utils.createErrorResponse(msgConstants.notValidEmail));

  const user = await regModel.findOne({ email: req.body.email.toLowerCase() });

  if (user) {
    if (!utils.comparePassword(req.body.password, user.password))
      return res.json(utils.createErrorResponse(msgConstants.wrongPassword));

    if (!user.verified) return res.json(utils.createErrorResponse(msgConstants.verify));
    let token = utils.generateToken({
      _id: user._id,
      password: user.password,
      deviceId: req.body.deviceId,
    });

    const loginSession = await regModel.updateOne(
      { email: req.body.email },
      { deviceId: req.body.deviceId, deviceModel: req.body.deviceModel }
    );

    await user.update({ active: true });
    await friendRequestModel.updateMany({ $or: [{ senderId: user["_id"] }, { sentTo: user["_id"] }] }, { active: true });
    await commentModel.updateMany({ userId: user["_id"] }, { active: true });
    await likeModel.updateMany({ userId: user["_id"] }, { active: true });
    await postsModel.updateMany({ userId: user["_id"] }, { active: true });

    if (loginSession) return res.json({ success: true, token, userId: user._id });
  } else return res.json(utils.createErrorResponse(msgConstants.userNotFound));
};

const getUserController = (req, res) => {
  let user = Object.assign({});

  for (let i of ["name", "email", "profile", "age"]) user[i] = req.user[i];
  return res.json(utils.createSuccessResponse("", user));
};

const changePassword = async (req, res) => {
  for (const i of ["oldPassword", "newPassword"])
    if (!req.body[i]) return res.json(utils.createErrorResponse(msgConstants.pp + ` ${i}`));

  let user = req.user;

  if (utils.comparePassword(req.body.oldPassword, user.password)) {
    user["password"] = utils.hashPassword(req.body.newPassword);
    await user.save();

    return res.json(utils.createSuccessResponse(msgConstants.passwordChanged));
  } else return res.json(utils.createErrorResponse(msgConstants.wrongOldPassword));
};

const forgetPassword = async (req, res) => {
  if (!req.body.email) return res.json(utils.createErrorResponse(msgConstants.pp + "email"));

  const checkUser = await regModel.findOne({ email: req.body.email });

  if (checkUser) {
    const requested = await regModel.updateOne({
      email: req.body.email,
      $set: { passwordChangeRequest: true },
    });

    if (requested) {
      sendMail(
        req.body.email,
        "Change your password",
        mailBody.fgMail(utils.generateToken({ _id: checkUser._id }), "Click to change")
      );
    }
    return res.json(utils.createSuccessResponse(msgConstants.forgetPassMsg));
  } else {
    return res.json(utils.createErrorResponse(msgConstants.wrongEmail));
  }
};

const resetPassword = async (req, res) => {
  if (!req.body.newpassword) return res.json(utils.createErrorResponse(msgConstants.provideNewPassword));

  if (req.user.passwordChangeRequest) {
    await regModel.updateOne(
      { _id: req.user._id },
      {
        password: utils.hashPassword(req.body.newpassword),
        passwordChangeRequest: false,
      }
    );
    return res.json(utils.createSuccessResponse(msgConstants.passwordChanged));
  } else {
    return res.json(utils.createErrorResponse(msgConstants.sessionExpired));
  }
};

const logout = async (req, res) => {
  let user = req.user;
  user["deviceId"] = null;
  user["deviceModel"] = null;
  await user.save();
  return res.json(utils.createSuccessResponse(msgConstants.logout));
};

const updateAccount = async (req, res) => {
  let user = req.user;

  for (let i of ["email", "name", "age"]) if (req.body[i]) user[i] = req.body[i];
  user["profile"] = req.file ? req.file.path : user["profile"];

  if (req.body["email"] && req.body["email"].toLowerCase() != user["email"]) {
    let emailExist = await regModel.findOne({
      email: req.body["email"].toLowerCase(),
    });

    if (emailExist) return res.json(utils.createErrorResponse(msgConstants.emailAlreadyExist));
  }

  await user.save();
  return res.json(utils.createSuccessResponse(msgConstants.updatedYourProfile));
};

const deActivateAccount = async (req, res) => {
  //block from main registraations.
  await regModel.updateOne({ _id: req.user._id }, { active: false, deviceId: null, deviceModel: null });

  //Block from all friend operations
  await friendRequestModel.updateMany(
    {
      $or: [{ senderId: req.user._id }, { sentTo: req.user._id }],
    },
    { active: false }
  );
  //Block from comments
  await commentModel.updateMany({ userId: req.user._id }, { active: false });
  await likeModel.updateMany({ userId: req.user._id }, { active: false });
  await postsModel.updateMany({ userId: req.user._id }, { active: false });
  return res.json(utils.createSuccessResponse(msgConstants.accountDeactivated));
};

const deleteAccount = async (req, res) => {
  await reportModel.deleteMany({ userId: req.user._id });
  await blockUserModel.deleteMany({ $or: [{ userId: req.user._id }, { blockedUserId: req.user._id }] });
  await friendRequestModel.deleteMany({ $or: [{ senderId: req.user._id }, { sentTo: req.user._id }] });
  await commentModel.deleteMany({ userId: req.user._id });
  await likeModel.deleteMany({ userId: req.user._id });
  await postsModel.deleteMany({ userId: req.user._id });
  await regModel.deleteOne({ _id: req.user._id });
  await messageModel.deleteMany({ $or: [{ from: req.user._id }, { to: req.user._id }] });
  return res.json(utils.createSuccessResponse(msgConstants.deletedYourAccount));
};

module.exports = {
  registerController,
  verifyController,
  loginController,
  updateAccount,
  getUserController,
  changePassword,
  forgetPassword,
  resetPassword,
  deleteAccount,
  logout,
  deActivateAccount,
};
