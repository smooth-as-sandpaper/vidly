module.exports = function(req, res, next) {
  // 401 - unauthorized - user tries to access w/o any token
  // 403 - forbidden - user tries to access with non-admin token
  if (!req.user.isAdmin) return res.status(403).send("Access denied.");
  next();
};
