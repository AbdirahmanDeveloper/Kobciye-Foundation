const express = require("express");
const viewsController = require("../controllers/viewsController")
const router = express.Router();

router.route("/").get(viewsController.getHomePage);
router.route("/login").get(viewsController.getLogin);
router.route("/signup").get(viewsController.getSignup);
router.route("/about").get(viewsController.getAbout);
router.route("/projects").get(viewsController.getProjects);
router.route("/projects/:id").get(viewsController.getProjectModal);
router.route("/blog").get(viewsController.getBlog);
router.get("/blog/:id", viewsController.getBlogModal);
router.route("/contact").get(viewsController.getContacts);
router.route("/admin").get(viewsController.getAdmin);
router.route("/payment").get(viewsController.getPayment);
router.get("/reset-password", viewsController.getResetPassword);
router.get("/otp", viewsController.getOTP);


module.exports = router