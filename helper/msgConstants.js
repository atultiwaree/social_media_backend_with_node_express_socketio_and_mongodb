module.exports.msgConstants = {
  // user mesages {Sir}
  tokenRequired: "Please enter authorization token.",
  sessionExpired: "Login session has been expired, please login again.",
  userRegistered: "Verification mail has been sent to your registered email address.Plese verify to login.",
  userNotRegistered: "Unable to register user, please try again.",
  forgetPassMsg: "Reset password mail has been sent to your registered email address.",
  logout: "Logged out successfully.",
  somethingWentWrong: "Something went wrong.",
  emailAlreadyExist: "Email address already exist.",
  notValidEmail: "Email address is not valid",

  //Please provide sections
  provideEmail: "Please provide email.",
  providePassword: "Please provide password.",
  provideNewPassword: "Please provide your new password.",
  provideOldPassword: "Please provide your old password",
  providePostId: "Please provide post id.",

  //Wrong section
  wrongPassword: "Provided password is not correct.",
  wrongEmail: "Provided email is not correct.",
  wrongOldPassword: "Provided old password was wrong.",

  //Verify
  verifyEmail: "Email sent please verify your account.",
  verify: "Please verify your account",
  accountVerified: "Your account is now verified.",

  //Not found
  userNotFound: "User not found.",

  //Success
  passwordChanged: "Successfully changed your password.",
  updatedYourProfile: "Successfully updated your profile.",
  deletedYourAccount: "Successffuly deleted your account.",
  successfullyUpdatedPost: "Post updated successfully.",
  deletedPostSuccessfully: "Post deleted successfully.",

  //Check
  enterDifferentEmail: "Kindly check your email or enter other email id.",

  /* Post Snippets */

  //required

  titleRequired: "You must add title for this post.",
  postIdIsRequired: "Please provide postId.",

  //Constraints
  numberOfPostImage: "Can't attach more than 5 photos to post.",

  //Success
  postCreated: "Successfully created your post.",

  //Misc
  postIsNotPresent: "Can not comment, post may be deleted.",
  listAllPost: "Showing you posts.",
  postDescription: "Detailed post.",
  noPostFound: "Post not found.",
  limitExceed: "Only upto 5 images can be added.",
  postLiked: "Post has been liked.",
  postDisliked: "Post has been disliked.",

  // followingPersonIdRequired: "You must provide persons ID to follow.",
  // unFollowPersonIdRequired: "To unfollow you must provide persons ID.",
  // followRequestSent: "Successfully sent follow request.",
  // alreadyFollowed: "Already sent follow request",
  // followRequestAccepted: "You accepted follow request",
  // followRequestRejected: "You rejected follow request",
  // unFollowedUser: "You unfollowed user.",
  badRequest: "Bad request.",
  postNotExist: "Post not present.",
  commentPosted: "Commented successfully.",
  falseValidId: "Invalid ObjectID provided",
  postCouldNotDeleted: "Post could not be deleted.",
  commentData: "List of comments for this post.",
  likeData: "List of likes for this post.",
  invalidId: "Id is not valid.",
  allowedOnlyVideoOrImage: "Invalid file, select either video or image file.",
  onlySinglePictureIsRequired: "Please attach single profile picture.",
  invalidPostId: "Please enter valid post id.",

  //Report Messages
  reportSubmitted: "Your report has been submitted to our concern team.",

  //Friends
  selfRequestDenied: "You can't send request to yourself.",
  friendRequestSent: "Friend request sent.",
  friendRequestSentAlreadySent: "Already sent friend request.",
  recievedRequestList: "List of recieved friend requests.",
  sentRequestList: "List of sent friend requests.",
  userAlreadySentYouRequest: "User already sent you friend request, please accept.",
  noFriendRequestPresentOfGivenAccount: "There is no friend request to you from given account.",
  friendRequestAccepted: "Friend request accepted.",
  alreadyAcceptedFriendRequest: "Friend request already accepted.",
  allFriendsList: "List of your all friends",
  friendRequestNotSent: "You have not sent friend request to the user.",
  youCancelledFriendRequest: "Friend request Cancelled.",
  userNotInYourFriendList: "User not in your friend list.",
  removedUserAsYourFriend: "User removed from your friends list.",
  userHasBeenBlocked: "User has been blocked.",
  userBlockedYou: "Sorry! something went wrong.",
  alreadyBlocked: "You alerady blocked user.",
  errorRetrivalComment: "Comment not found for this post.",
  alreadyReported: "Post already reported by you.",

  //Account Deactivated
  accountDeactivated: "Your account has been deactivated, login again to activate.",
  alreadyDeactivated: "Account is already deactivated.",

  //Sharing Post
  postShared: "Shared post to your timeline.",

  //Socket messges

  socketConnected: "Connected successfully.",
  socketDisconnected: "Disconnected successfully.",
  pleaseLogin: "Please login.",
  pleaseLoginToChat: "Please login to send message.",
  thereIsNoChatBetweenThem: "Chat not found between users.",
  chatDeletedSuccessfully: "Chat deleted successfully.",
  messageNotExist: "Message does not exist.",
  messageSeen: "Message seen.",
  userIsBlockedByYou: "User is blocked.",
};
