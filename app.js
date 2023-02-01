const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
//Import routes for "catalog" area of site
const catalogRouter = require("./routes/catalog");
const compression = require("compression");
const helmet = require("helmet");
const app = express();

// Set up mongoose connection
const mongoose = require('mongoose');
mongoose.set('strictQuery', false);
const dev_db_url = 'mongodb+srv://philippealejandrob:AnaVic1949@cluster0.x8y0ajb.mongodb.net/local_library?retryWrites=true&w=majority';
const mongoDB = process.env.MONGODB_URI || dev_db_url;

main().catch(err => console.log(err));
async function main() {
  await mongoose.connect(mongoDB);
}

// view engine 
// There are two parts to setting up the engine. First, we set the 'views' value 
// to specify the folder where the templates will be stored (in this case the 
// subfolder /views).
app.set('views', path.join(__dirname, 'views'));
// Then we set the 'view engine' value to specify the template 
// library (in this case "pug").
app.set('view engine', 'pug');
// express.json() and express.urlencoded() are needed to populate req.body
app.use(helmet());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(compression()); // Compress all routes
// express.static middleware, which makes Express serve 
// all the static files in the /public directory in the project root
app.use(express.static(path.join(__dirname, 'public')));
// The imported code will define particular routes for the different parts of the site:
app.use('/', indexRouter);
app.use('/users', usersRouter);
// Add catalog routes to middleware chain.
app.use("/catalog", catalogRouter);
// adds handler methods for errors and HTTP 404 responses
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
