const express = require("express");
const cookieSession = require('cookie-session')
const bcrypt = require("bcryptjs");
const { getUserByEmail, generateRandomString, urlsForUser } = require("./helpers");
const { urlDatabase, users } = require("./database");

const app = express();
const PORT = 8080; // default port 8080
app.set("view engine", "ejs"); //EJS
app.use(cookieSession({
  name: 'session',
  keys: ["keys"],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))
app.use(express.urlencoded({ extended: true })); //Parser to convert buffer data into strings we can use 

app.get("/", (req, res) => {
  if (req.session.user_id) {
    return res.redirect("/urls")
  }

  res.redirect("/login")
});


app.get("/login", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  if (user) {
    // User is already logged in
    res.redirect("/urls");
  } else {
    // User is not logged in
    res.render("login", { user });
  }
});

app.get("/register", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  if (user) {
    // User is already logged in
    res.redirect("/urls");
  } else {
    // User is not logged in
    res.render("register", { user });
  }
});

app.get("/urls", (req, res) => {
  const userId = req.session["user_id"];
  const user = users[userId];

  if (!user) {
    // User is not logged in, redirect to login
    return res.redirect("/login");
  }

  // User is logged in, display their URLs
  const userUrls = urlsForUser(userId, urlDatabase);
  const templateVars = {
    user,
    urls: userUrls,
  };
  res.render("urls_index", templateVars);

});

app.get("/urls/new", (req, res) => {
  const userId = req.session["user_id"];
  const user = users[userId];

  if (user) {
    const templateVars = {
      user,
    };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/:id", (req, res) => {
  const id = req.params.id;
  const urlInfo = urlDatabase[id];
  const userId = req.session["user_id"];
  const user = users[userId];

  if (!user) {
    // User is not logged in, display an error message or prompt
    return res.render("error", { user, message: "Please log in or register to view this URL." });
  }

  if (!urlInfo) {
    // URL does not exist
    return res.render("error", { user, message: "URL does not exist" });
  }

  if (urlInfo.userID !== userId) {
    // URL does not belong to the logged-in user, display an error message or prompt
    return res.render("error", { user, message: "You do not own this URL." })
  }

  // URL belongs to the logged-in user, render the URLs_show template
  const longURL = urlInfo.longURL;
  const templateVars = { id, longURL, user };
  res.render("urls_show", templateVars);

});

//Redirect
app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const urlInfo = urlDatabase[shortURL];
  const userID = req.session.user_id;
  const user = users[userID];

  if (urlInfo) {
    const longURL = urlInfo.longURL;
    // Check if the longURL starts with "http://" or "https://"
    if (!/^https?:\/\//i.test(longURL)) {
      // If the protocol is missing, prepend "http://" before redirecting
      res.redirect("http://" + longURL);
    } else {
      res.redirect(longURL);
    }
  } else {
    res.status(404).render("error", { user, message: "Short URL not found" });
  }
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  // Error handling 
  if (!email || !password) {
    res.status(400).render("error", { user: undefined, message: "Email and password fields cannot be empty." });
    return;
  }
  // Existing account
  const user = getUserByEmail(email, users);
  if (user) {
    res.status(400).render("error", { user: undefined, message: "Email already registered." });
    return;
  }
  // Generate a unique user ID and user
  const userId = generateRandomString();
  const newUser = {
    id: userId,
    email,
    password: bcrypt.hashSync(password, 10),
  };

  users[userId] = newUser;
  // Cookie
  req.session.user_id = userId;
  // Redirect 
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).render("error", { user: undefined, message: "Email and password fields cannot be empty." });
  }

  const user = getUserByEmail(email, users);

  if (!user) {
    return res.status(403).render("error", { user: undefined, message: "User with this email does not exist." });
  }
  //  login check
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).render("error", { user: undefined, message: "Incorrect password." });
  }
  // Cookie
  req.session.user_id = user.id;
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  const userId = req.session["user_id"];
  const user = users[userId];

  if (user) {
    const longURL = req.body.longURL;
    if (longURL) {
      const shortURL = generateRandomString();
      urlDatabase[shortURL] = { longURL, userID: userId }; // Update the urlDatabase with the new structure
      res.redirect(`/urls/${shortURL}`);
    } else {
      res.status(400).render("error", { user, message: "Invalid URL. Please provide a valid URL." });
    }
  } else {
    // User is not logged in, respond with an error message
    res.status(403).render("error", { user, message: "You must be logged in to create a new URL." });
  }
});

//Delete URLs
app.post("/urls/:id/delete", (req, res) => {
  const shortURL = req.params.id;
  const userId = req.session["user_id"];
  const user = users[userId];

  if (!user) {
    // User is not logged in, respond with an error message
    res.status(403).send("You must be logged in to delete this URL.");
  } else if (!urlDatabase[shortURL]) {
    // URL does not exist, respond with an error message
    res.status(404).send("URL not found.");
  } else if (urlDatabase[shortURL].userID !== userId) {
    // URL does not belong to the logged-in user, respond with an error message
    res.status(403).send("You do not own this URL.");
  } else {
    // If the shortURL exists in the urlDatabase and belongs to the logged-in user, remove it using the delete operator
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  }
});

//Update URLs
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const newLongURL = req.body.longURL;
  const userId = req.session["user_id"];
  const user = users[userId];

  if (!user) {
    // User is not logged in, respond with an error message
    res.status(403).send("You must be logged in to update this URL.");
  } else if (!urlDatabase[shortURL]) {
    // URL does not exist, respond with an error message
    res.status(404).send("URL not found.");
  } else if (urlDatabase[shortURL].userID !== userId) {
    // URL does not belong to the logged-in user, respond with an error message
    res.status(403).send("You do not own this URL.");
  } else {
    // URL belongs to the logged-in user, update the longURL in the urlDatabase
    urlDatabase[shortURL].longURL = newLongURL;
    res.redirect("/urls");
  }
});


//Logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
