exports.isAuthenticated = async (req, res, next) => {
  if (req.isAuthenticated()) {
    console.log("User is authenticated");
    return next();
  } else {
    console.log("User is not authenticated");
    return res.status(401).json({ message: "User is not authenticated" });
  }
};
// Update your isAdmin middleware to check if the user is an admin
exports.isAdmin = async (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === "admin") {
    console.log("User is authenticated and is an admin");
    return next();
  } else {
    // console.log("User is not authenticated or is not an admin");
    return res.status(401).json({ message: "User is not authorized" });
  }
};
exports.authUser = function (req, res) {
  if (req.isAuthenticated()) {
    // User is authenticated
    res.status(200).json({ authenticated: true, user: req.user });
  } else {
    // User is not authenticated
    res.status(401).json({ authenticated: false });
  }
};
