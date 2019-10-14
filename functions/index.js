const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const app = require("express")();

const firebaseConfig = {
  apiKey: "AIzaSyDwvUtgtMvpQkTyYFHC64wb-DYbAOdOaog",
  authDomain: "projectx-ad84f.firebaseapp.com",
  databaseURL: "https://projectx-ad84f.firebaseio.com",
  projectId: "projectx-ad84f",
  storageBucket: "projectx-ad84f.appspot.com",
  messagingSenderId: "606252664169",
  appId: "1:606252664169:web:304af177db93b1f737e9f8",
  measurementId: "G-V86R7NY559"
};

const firebase = require("firebase");

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

app.get("/posts", (req, res) => {
  db.collection("posts")
    .orderBy("createdAt", "desc")
    .get()
    .then(data => {
      let posts = [];
      data.forEach(doc => {
        posts.push({
          postId: doc.id,
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt
        });
      });
      return res.json(posts);
    })
    .catch(err => console.error(err));
});

app.post("/post", (req, res) => {
  const newPost = {
    body: req.body.body,
    userHandle: req.body.userHandle,
    createdAt: new Date().toISOString()
  };
  db.collection("posts")
    .add(newPost)
    .then(doc => {
      res.json({ message: `document ${doc.id} created successfully` });
    })
    .catch(err => {
      res.status(500).json({ error: `something went wrong` });
      console.error(err);
    });
});

const empty = string => {
  if (string.trim() == "") return true;
  else return false;
};
const isemail = email => {
  if (string.trim() == "") return true;
  else return false;
};

//nevtreh

app.post("/signup", (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle
  };

  let errors = {};
  let bigtoken, userId;

  if (empty(newUser.email)) {
    errors.email = "Email must not be empty";
  }

  if (empty(newUser.password)) errors.password = "Must not empty";

  if (newUser.password != newUser.confirmPassword)
    errors.confirmPassword = "Password must be match";
  if (empty(newUser.handle)) errors.handle = "Must not empty";

  if (Object.keys(errors).length > 0) return res.status(400).json(errors);

  db.collection("users")
    .doc(newUser.handle)
    .get()
    .then(doc => {
      if (doc.exists) {
        return res
          .status(400)
          .json({ handle: "this handle is already taken " });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then(data => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then(token => {
      bigtoken = token;
      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId
      };
      return db
        .collection("users")
        .doc(newUser.handle)
        .set(userCredentials);
    })
    .then(() => {
      return res.status(201).json({ bigtoken });
    })
    .catch(err => {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        return res.status(400).json({ email: "already taken" });
      } else {
        return res.status(500).json({ error: err.code });
      }
    });
});

app.post("login", (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password
  };
  let errors = {};

  if (empty(user.email)) errors.email = "email not be empty";
  if (empty(user.password)) errors.password = "password not be empty";

  if (Object.keys(errors).length > 0) return res.status(400).json(errors);

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then(data => {
      return data.getIdToken();
    })
    .then(token => {
      return res.json({ token });
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ err: err.code });
    });
});

//for extend the fucking memory and timeout
// const runtimeOpts = {
//   timeoutSeconds: 300,
//   memory: '1GB'
// }

// exports.myStorageFunction = functions
//   .runWith(runtimeOpts)
//   .storage
//   .object()
//   .onFinalize((object) = > {
//     // do some complicated things that take a lot of memory and time
//   });

exports.api = functions.region("asia-east2").https.onRequest(app);
