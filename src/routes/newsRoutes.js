const express = require("express");
const newsController = require("../controllers/newsController.js");
const { protect, restrictTo } = require("../middleware/authMiddlewares");
const upload = require("../middleware/newsUpload.js");

const router = express.Router();

router
  .route("/")
  .get(newsController.getAllNews)
  .post(
    protect,
    restrictTo("admin"),
    upload.single("image"),
    newsController.createNews
  );

router
  .route("/:id")
  .get(newsController.getSingleNews)
  .patch(
    protect,
    restrictTo("admin"),
    upload.single("image"),
    newsController.updateNews
  )
  .delete(protect, restrictTo("admin"), newsController.deleteNews);

module.exports = router;
