# Secrets

## Introduction

> This app was developed for learning user authentication via Node.js, using passport and Google OAuth.

> The app allows users to create an account using either an email and password, or Google OAuth. It then allows them to either submit their own secrets, or view other users secrets (anonymously).

> This app was developed as part of a [Udemy course on Web Development](https://www.udemy.com/course/the-complete-web-development-bootcamp/).

## Installation

- Clone the repository
```
git clone  https://github.com/JDhilon/secrets.git secrets
```

- Install dependencies
```
cd secrets
npm install
```

- Build and run the project
```
npm start
```
Navigate to `http://localhost:3000`

Note this project does require setting up [Google OAuth2.0](http://www.passportjs.org/docs/google/), and then creating a ```.env``` file with ```CLIENT_ID``` and ```CLIENT_SECRET```

## Limitations
- No option to stay logged in, or remember user details which leads to users needing to log in every time they access the site. 
- Users currently can only submit a single secret each, which is overridden if they submit a new one. 