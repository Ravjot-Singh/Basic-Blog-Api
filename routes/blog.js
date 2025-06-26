const { Router } = require("express");
const multer = require("multer");
const path = require("path");

const Blog = require("../models/blog");
const Comment = require("../models/comment");

const router = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(`./public/uploads/`));
  },
  filename: function (req, file, cb) {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage: storage });


router.get("/add-new", (req, res) => {
  return res.render("addBlog", {
    user: req.user,
  });
});




router.get("/:id", async (req, res) => {
  const blog = await Blog.findById(req.params.id).populate("createdBy");
  const comments = await Comment.find({ blogId: req.params.id }).populate(
    "createdBy"
  );

  return res.render("blog", {
    user: req.user,
    blog,
    comments,
  });
});



router.post("/comment/:blogId", async (req, res) => {
  await Comment.create({
    content: req.body.content,
    blogId: req.params.blogId,
    createdBy: req.user._id,
  });
  return res.redirect(`/blog/${req.params.blogId}`);
});



router.post("/", upload.single("coverImage"), async (req, res) => {
  const { title, body } = req.body;

  const coverImageURL = req.file
    ? `/uploads/${req.file.filename}`
    : `/images/default.png`; 

  try {
    const blog = await Blog.create({
      body,
      title,
      createdBy: req.user._id,
      coverImageURL,
    });

    return res.redirect(`/blog/${blog._id}`);
  } catch (error) {
    console.error("Error creating blog:", error);
    return res.status(500).send("Internal Server Error");
  }
});


router.get("/edit/:id", async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    return res.status(404).send("Blog not found");
  }

  if (blog.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).send("Unauthorized");
  }

  return res.render("editBlog", {
    user: req.user,
    blog,
  });
});



router.post("/update/:id", upload.single("coverImage"), async (req, res) => {
  const { title, body } = req.body;
  const blogId = req.params.id;

  try {
    const blog = await Blog.findById(blogId);

    
    if (!blog) {
      return res.status(404).send("Blog not found");
    }

   
    if (blog.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).send("Unauthorized to update this blog");
    }

    
    blog.title = title || blog.title;
    blog.body = body || blog.body;

    
    if (req.file) {
      blog.coverImageURL = `/uploads/${req.file.filename}`;
    }

    await blog.save();

    return res.redirect(`/blog/${blog._id}`);
  } catch (error) {
    console.error("Error updating blog:", error);
    return res.status(500).send("Internal Server Error");
  }
});



module.exports = router;
