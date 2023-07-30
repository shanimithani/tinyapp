const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
app.set("view engine", "ejs"); //EJS
const cookieParser = require("cookie-parser");
app.use(cookieParser());

const urlDatabase = {
  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID",
  },
  asm5xK: {
    longURL: "http://www.google.com",
    userID: "user2RandomID",
  },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

function getUserUrls(userId) {
  const userUrls = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === userId) {
      userUrls[shortURL] = urlDatabase[shortURL];
    }
  }
  return userUrls;
}

app.use(express.urlencoded({ extended: true })); //Parser to convert buffer data into strings we can use 

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

/**app.get("/register", (req, res) => { //Registration page
  res.render("register");
});

app.get("/login", (req, res) => {
  res.render("login");
});**/

app.get("/login", (req, res) => {
  const userId = req.cookies.user_id;
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
  const userId = req.cookies.user_id;
  const user = users[userId];
  if (user) {
    // User is already logged in
    res.redirect("/urls");
  } else {
    // User is not logged in
    res.render("register");
  }
});

app.get("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  const userUrls = getUserUrls(userId); // Helper function to get URLs for a specific user
  const templateVars = {
    user,
    urls: userUrls,
  };
  res.render("urls_index", templateVars);
});



/**app.get("/urls/new", (req, res) => { //Connects to form to make new URL, has to be shown before urls/id
  res.render("urls_new"); 
});

app.get("/urls/:id", (req, res) => { //Connects to single URL (replaced by ID)
  const id = req.params.id; // Extract the id from the URL
  const longURL = urlDatabase[id]; // Retrieve the long URL from the urlDatabase using the id as the key
  const templateVars = { id: id, longURL: longURL }; // Create the templateVars object to pass to the template
  res.render("urls_show", templateVars);
}); **/


app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];
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
  const urlInfo = urlDatabase[id]; // Get the entire object 
  const longURL = urlInfo ? urlInfo.longURL : undefined; // Access longURL property 
  const userId = req.cookies["user_id"];
  const user = users[userId];
  const templateVars = { id, longURL, user };
  res.render("urls_show", templateVars);
});



//Redirect
app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];
  if (longURL) {
    res.redirect(longURL);
  } else {
    res.status(404).send("Short URL not found");
  }
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
// Error handling 
  if (!email || !password) {
    res.status(400).send("Email and password fields cannot be empty.");
    return;
  }
  // Existing account
  const user = Object.values(users).find((user) => user.email === email);
  if (user) {
    res.status(400).send("Email already registered.");
    return;
  }
  // Generate a unique user ID and user
  const userId = generateRandomString();
  const newUser = {
    id: userId,
    email,
    password,
  };
  users[userId] = newUser;
  // Cookie
  res.cookie("user_id", userId);
  // Redirect 
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).send("Email and password fields cannot be empty.");
    return;
  }

  const user = Object.values(users).find((user) => user.email === email);

  if (!user) {
    res.status(403).send("User with this email does not exist.");
    return;
  }
  //  login check
  if (user.password !== password) {
    res.status(403).send("Incorrect password.");
    return;
  }
  // Cookie
  res.cookie("user_id", user.id);
  res.redirect("/urls");
});



app.post("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];

  if (user) {
    const longURL = req.body.longURL;
    if (longURL) {
      const shortURL = generateRandomString();
      urlDatabase[shortURL] = { longURL, userID: userId }; // Update the urlDatabase with the new structure
      res.redirect(`/urls/${shortURL}`);
    } else {
      res.status(400).send("Invalid URL. Please provide a valid URL.");
    }
  } else {
    // User is not logged in, respond with an error message
    res.status(403).send("You must be logged in to create a new URL.");
  }
});

//Delete URLs
app.post("/urls/:id/delete", (req, res) => {
  const shortURL = req.params.id; // Get the shortURL 

  if (urlDatabase[shortURL]) {
    // If the shortURL exists in the urlDatabase, remove it using the delete operator
    delete urlDatabase[shortURL];
    res.redirect("/urls"); 
  } else {
    res.status(404).send("Short URL not found");
  }
});

//Update URLs
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id; // Get the shortURL from the request parameter 
  const newLongURL = req.body.longURL; // Get the new longURL 

  if (urlDatabase[shortURL]) {
    urlDatabase[shortURL] = newLongURL;
    res.redirect("/urls"); // Redirect the client back to the urls_index page
  } else {
    res.status(404).send("Short URL not found");
  }
});

//Logout
/**app.post("/logout", (req, res) => {
  res.clearCookie("user_id"); // Clear the 'username' cookie
  res.redirect("/urls"); // Redirect the user back to the /urls page
}); **/

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login"); 
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() { //Creates the URL 
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let randomString = '';

  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * charactersLength);
    randomString += characters.charAt(randomIndex);
  }

  return randomString;
}