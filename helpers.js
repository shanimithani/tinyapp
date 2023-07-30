function getUserByEmail(email, users) {
    for (const userID in users) {
        if (users[userID].email === email) {
            return users[userID]
        }
    }
}

function urlsForUser(id, urlDatabase) {
    const userUrls = {};
    for (const shortURL in urlDatabase) {
        if (urlDatabase[shortURL].userID === id) {
            userUrls[shortURL] = urlDatabase[shortURL];
        }
    }
    return userUrls;
}

function generateRandomString() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let randomString = '';

    for (let i = 0; i < 6; i++) {
        const randomIndex = Math.floor(Math.random() * charactersLength);
        randomString += characters.charAt(randomIndex);
    }

    return randomString;
}

module.exports = { getUserByEmail, urlsForUser, generateRandomString }