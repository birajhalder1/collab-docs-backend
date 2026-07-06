const dashboardService = require("../services/dashboard.service");

const getDashboard = async (req, res, next) => {
  try {
    const dashboard = await dashboardService.getDashboard(req.user._id);

    res.json({
      success: true,
      data: dashboard,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboard,
};
