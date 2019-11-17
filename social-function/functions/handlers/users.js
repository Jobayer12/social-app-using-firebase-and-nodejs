const { admin, db } = require("../util/admin");
const config = require("../util/config");
const firebase = require("firebase");
firebase.initializeApp(config);

const {
  vaidationDataSignUp,
  vaidationDataLogin,
  reduceUserDetails
} = require("../util/validatores");

exports.signup = (req, res) => {
  const newuser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle
  };

  const { valid, errors } = vaidationDataSignUp(newuser);
  if (!valid) return res.status(400).json({ errors });

  let token, userId;
  db.doc(`/users/${newuser.handle}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        return res.status(400).json({ handle: "this handle already taken" });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newuser.email, newuser.password);
      }
    })
    .then(data => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then(tokenId => {
      token = tokenId;
      const newCredentials = {
        handle: newuser.handle,
        email: newuser.email,
        createdAt: new Date().toISOString(),
        imageUrl:
          "https://firebasestorage.googleapis.com/v0/b/socialape-37555.appspot.com/o/blank-profile-picture-973460_640.png?alt=media",
        userId
      };

      return db.doc(`/users/${newuser.handle}`).set(newCredentials);
    })
    .then(() => {
      return res.status(201).json({ token });
    })
    .catch(err => {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        return res.status(400).json({ email: "email already use" });
      }
      else{
        return res.status(500).json({ general:"something went worng.Please try again " });
      }
     
    });
};

exports.signin = (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password
  };

  const { valid, errors } = vaidationDataLogin(user);
  if (!valid) return res.status(400).json({ errors });

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then(data => {
      return data.user.getIdToken();
    })
    .then(token => {
      return res.json({ token });
    })
    .catch(err => {
      console.error(err);
      return res
      .status(403)
      .json({ general: 'Wrong credentials, please try again' });
    });
};

exports.userDetails = (req, res) => {
  let userDetails = reduceUserDetails(req.body);

  db.doc(`/users/${req.user.handle}`)
    .update(userDetails)
    .then(() => {
      return res.json({ message: "details update successfully" });
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

exports.getAuthenticatedUser = (req, res) => {
  let userData = {};
  db.doc(`/users/${req.user.handle}`)
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(401).json({ error: "Profile doesn't exists" });
      }

      userData.credentials = doc.data();
      return db
        .collection("likes")
        .where("userHandle", "==", req.user.handle)
        .get();
    })
    .then(data => {
      userData.likes = [];
      data.forEach(doc => {
        userData.likes.push(doc.data());
      });
      return db.collection('notifications').where('reception','==',req.user.handle).orderBy('createdAt','desc').limit(10).get();
    }).then((data)=>{

      userData.notification=[];
      data.forEach(doc=>{

        userData.notification.push({
            reception: doc.data().reception,
            sender: doc.data().sender,
            read: doc.data().read,
            screamId: doc.data().id,
            type: doc.data().type,
            createdAt: doc.data().createdAt,
            notificationId:doc.id
        })

      });
      return res.json(userData);

    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

exports.uploadimage = (req, res) => {
  const BusBoy = require("busboy");
  const path = require("path");
  const os = require("os");
  const fs = require("fs");

  const busboy = new BusBoy({ headers: req.headers });

  let imageToBeUploaded = {};
  let imageFileName;

  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    console.log(fieldname, file, filename, encoding, mimetype);
    if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
      return res.status(400).json({ error: "Wrong file type submitted" });
    }
    // my.image.png => ['my', 'image', 'png']
    const imageExtension = filename.split(".")[filename.split(".").length - 1];
    // 32756238461724837.png
    imageFileName = `${Math.round(
      Math.random() * 1000000000000
    ).toString()}.${imageExtension}`;
    const filepath = path.join(os.tmpdir(), imageFileName);
    imageToBeUploaded = { filepath, mimetype };
    file.pipe(fs.createWriteStream(filepath));
  });
  busboy.on("finish", () => {
    admin
      .storage()
      .bucket()
      .upload(imageToBeUploaded.filepath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageToBeUploaded.mimetype
          }
        }
      })
      .then(() => {
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
        return db.doc(`/users/${req.user.handle}`).update({ imageUrl });
      })
      .then(() => {
        return res.json({ message: "image uploaded successfully" });
      })
      .catch(err => {
        console.error(err);
        return res.status(500).json({ error: "something went wrong" });
      });
  });
  busboy.end(req.rawBody);
};

exports.getUserDetails=(req,res)=>{

  let userData={};
  db.doc(`/users/${req.params.handle}`).get().then((doc)=>{

    if (!doc.exists) {
      return res.status(404).json({ error: "User not found" });
    }
    userData.user=doc.data();
    return db.collection('screams').where('userHandle','==',req.params.handle).orderBy('createdAt','desc').get();
  }).then(data=>{

    userData.screams=[];
    data.forEach(doc=>{

      userData.screams.push({
        body:doc.data().body,
        createdAt:doc.data().createdAt,
        userHandle:doc.data().userHandle,
        userImage:doc.data().userImage,
        likeCount:doc.data().likeCount,
        commentCount:doc.data().commentCount,
        screamId:doc.id
        
      })

    });

    return res.json(userData);

  })
  .catch(err => {
    console.error(err);
    return res.status(500).json({ error: err.code });
  });

}
exports.markNotificationsRead = (req, res) => {
  let batch = db.batch();
  req.body.forEach((notificationId) => {
    const notification = db.doc(`/notifications/${notificationId}`);
    batch.update(notification, { read: true });
  });
  batch
    .commit()
    .then(() => {
      return res.json({ message: 'Notifications marked read' });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};