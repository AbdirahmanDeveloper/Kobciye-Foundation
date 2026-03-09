const express = require("express");
const viewsController = require("../controllers/viewsController")
const router = express.Router();

router.route("/").get(viewsController.getHomePage);
router.route("/login").get(viewsController.getLogin);
router.route("/signup").get(viewsController.getSignup);
router.route("/about").get(viewsController.getAbout);
router.route("/projects").get(viewsController.getProjects);
router.route("/blog").get(viewsController.getBlog);
router.get("/blog/:id", viewsController.getBlogModal);
router.route("/contact").get(viewsController.getContacts);
router.route("/admin").get(viewsController.getAdmin);
router.route("/payment").get(viewsController.getPayment);
router.get('/payment/success', viewsController.getPaymentSuccess);
router.get("/reset-password", viewsController.getResetPassword);
router.get("/otp", viewsController.getOTP);
router.get("/reset-email", viewsController.getResetEmail);


module.exports = router