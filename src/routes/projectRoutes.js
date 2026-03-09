const express = require("express");
const projectController = require("../controllers/projectController");
const { protect, restrictTo } = require("../middleware/authMiddlewares");
const upload = require("../middleware/projectsUpload.js");

const router = express.Router();

router
  .route("/")
  .get(projectController.getAllProjects)
  .post(
    protect,
    restrictTo("admin"),
    upload.single("image"),
    projectController.createProject
  );

router
  .route("/createProject")
  .post(
    protect,
    restrictTo("admin"),
    upload.single("image"),
    projectController.createProject
  );

router.get(
  "/countProjects",
  protect,
  restrictTo("admin"),
  projectController.countProjects
);

router
  .route("/:id")
  .get(projectController.getSingleProject)
  .patch(protect, restrictTo("admin"), projectController.updateProject)
  .delete(protect, restrictTo("admin"), projectController.deleteProject);

module.exports = router;
