const BookInstance = require("../models/bookinstance");
const async = require("async");
const { body, validationResult } = require("express-validator");
const Book = require("../models/book");

// Display list of all BookInstances.
exports.bookinstance_list = function (req, res, next) {
  BookInstance.find()
    .populate("book")
    .exec(function (err, list_bookinstances) {
      if (err) {
        return next(err);
      }
      // Successful, so render
      res.render("bookinstance_list", {
        title: "Book Instance List",
        bookinstance_list: list_bookinstances,
      });
    });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = (req, res, next) => {
  BookInstance.findById(req.params.id)
    .populate("book")
    .exec((err, bookinstance) => {
      if (err) {
        return next(err);
      }
      if (bookinstance == null) {
        // No results.
        const err = new Error("Book copy not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render.
      res.render("bookinstance_detail", {
        title: `Copy: ${bookinstance.book.title}`,
        bookinstance,
      });
    });
};


// Display BookInstance create form on GET.
exports.bookinstance_create_get = (req, res, next) => {
  Book.find({}, "title").exec((err, books) => {
    if (err) {
      return next(err);
    }
    // Successful, so render.
    res.render("bookinstance_form", {
      title: "Create BookInstance",
      book_list: books,
    });
  });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  // Validate and sanitize fields.
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped and trimmed data.
    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values and error messages.
      Book.find({}, "title").exec(function (err, books) {
        if (err) {
          return next(err);
        }
        // Successful, so render.
        res.render("bookinstance_form", {
          title: "Create BookInstance",
          book_list: books,
          selected_book: bookinstance.book._id,
          errors: errors.array(),
          bookinstance,
        });
      });
      return;
    }

    // Data from form is valid.
    bookinstance.save((err) => {
      if (err) {
        return next(err);
      }
      // Successful: redirect to new record.
      res.redirect(bookinstance.url);
    });
  },
];


// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = (req, res) => {
  async.parallel(
    {
      bookInstances(callback) {
        BookInstance.findById(req.params.id)
        .populate("book")
        .exec(callback);
      }
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.bookInstances == null) {
        // No results.
        res.redirect("/catalog/bookinstances");
      }
      // Successful, so render.
      res.render("bookInstance_delete", {
        title: "Delete Book Instance",
        book_instance: results.bookInstances
      });
    }
  );
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = (req, res) => {
  async.parallel(
    {
      bookInstances(callback) {
        BookInstance.findById(req.params.id).exec(callback);
      }
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.bookInstances == null) {
        // No results.
        res.redirect("/catalog/bookinstances");
      }
      // Delete object and redirect to the list of authors.
      BookInstance.findByIdAndRemove(req.body.bookInstanceId, (err) => {
        if (err) {
          return next(err);
        }
        // Success - go to book instance list
        res.redirect("/catalog/bookinstances");
      });
    }
  );
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = (req, res) => {
    // res.send("NOT IMPLEMENTED: Author update GET");
    async.parallel(
      {
        bookinstance(callback) {
          BookInstance.findById(req.params.id).exec(callback);
        },
        listBooks(callBack) {
          Book.find({}, "title").sort({ title: 1 }).exec(callBack);
        }
      },
      (err, results) => {
        if (err) {
          return next(err);
        }
        if (results.bookinstance == null) {
          // No results.
          const err = new Error("Book Instance not found");
          err.status = 404;
          return next(err);
        }
        res.render("bookinstance_form", {
          title: "Update Book Instance",
          bookinstance: results.bookinstance,
          book_list: results.listBooks
        });
      }
    );
  };

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  body("imprint")
  .trim()
  .isLength({ min: 1 })
  .escape()
  .withMessage("Imprint must be specified.")
  .isAlphanumeric()
  .withMessage("Imprint has non-alphanumeric characters."),
  body("due_back", "Invalid date of delivery")
  .optional({ checkFalsy: true })
  .isISO8601()
  .toDate(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/errors messages.
      res.render("bookinstance_form", {
        title: "Update BookInstance",
        bookinstance: req.body,
        errors: errors.array(),
      });
      return;
    }

    // Create an Author object with escaped and trimmed data.
    const bookInstance = new BookInstance({
    book: req.body.book,
    imprint: req.body.imprint,
    status: req.body.status,
    due_back: req.body.due_back,
    _id: req.params.id, //This is required, or a new ID will be assigned!
  });
  
    // Data from form is valid. Update the record.
    BookInstance.findByIdAndUpdate(req.params.id, bookInstance, {}, (err, theBookIns) => {
      if (err) {
        return next(err);
      }
      // Successful - redirect to new author record.
      res.redirect(theBookIns.url);
    });
  }
];
