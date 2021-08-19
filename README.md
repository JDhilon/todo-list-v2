# To-Do List

## Introduction

> This app was developed for creating remote to do lists via Node.js, using MongoDB, passport and Google OAuth.

> The app allows users to create an account using either an email and password, or Google OAuth. It then allows them to create and manage their own todo lists.

## Installation

- Clone the repository
```
git clone  https://github.com/JDhilon/todo-list-v2.git todo-list-v2
```

- Install dependencies
```
cd todo-list-v2
npm install
```

- Build and run the project
```
npm start
```
Navigate to `http://localhost:3000`

Note this project does require setting up [Google OAuth2.0](http://www.passportjs.org/docs/google/), and then creating a ```.env``` file with ```CLIENT_ID``` and ```CLIENT_SECRET```

## Limitations
- No option to share lists at this time
- Only a single list per user
