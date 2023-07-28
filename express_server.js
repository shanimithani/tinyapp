const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
app.set("view engine", "ejs"); //EJS

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

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

app.get("/urls", (req, res) => { //Connects to urls_index.ejs
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => { //Connects to form to make new URL, has to be shown before urls/id
  res.render("urls_new"); 
});

app.get("/urls/:id", (req, res) => { //Connects to single URL (replaced by ID)
  const id = req.params.id; // Extract the id from the URL
  const longURL = urlDatabase[id]; // Retrieve the long URL from the urlDatabase using the id as the key
  const templateVars = { id: id, longURL: longURL }; // Create the templateVars object to pass to the template
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => { //The actual redirects
  const shortURL = req.params.id; // Get the shortURL from the request parameter 
  const longURL = urlDatabase[shortURL]; // Look up the longURL from the urlDatabase 
  if (longURL) {
    // If the longURL exists in the urlDatabase, redirect the user to the longURL
    res.redirect(longURL);
  } else {
    res.status(404).send("Short URL not found");
  }
});


app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  res.send("Ok"); // Respond with 'Ok' (we will replace this)
});

app.post("/urls", (req, res) => {
  const longURL = req.body.longURL; // Get the long URL from the form submission
  // Generate a unique short URL ID using the generateRandomString function
  const shortURL = generateRandomString();
  // Add the new URL to the urlDatabase with the generated short URL ID as the key
  urlDatabase[shortURL] = longURL;
  // Redirect the user to the URL show page for the newly created short URL
  res.redirect(`/urls/${shortURL}`);
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