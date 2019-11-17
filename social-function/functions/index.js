const functions = require("firebase-functions");

const app = require("express")();

const { db } = require("./util/admin");

const {
  getAllScreams,
  postOneScreams,
  getScream,
  commentOnScream,
  likeScream,
  unlikeScream,
  deleteScream
} = require("./handlers/screams");
const {
  signup,
  signin,
  uploadimage,
  userDetails,
  getAuthenticatedUser,
  getUserDetails,
  markNotificationsRead
} = require("./handlers/users");
const fbAuth = require("./util/fbAuth");

//Screams routes
app.get("/screams", getAllScreams);
app.post("/screams", fbAuth, postOneScreams);
app.get("/screams/:screamId", getScream);
app.delete("/screams/:screamId", fbAuth, deleteScream);
app.get("/screams/:screamId/likes", fbAuth, likeScream);
app.get("/screams/:screamId/unlikes", fbAuth, unlikeScream);
app.post("/screams/:screamId/comment", fbAuth, commentOnScream);

//User route
app.post("/signup", signup);
app.post("/signin", signin);
app.post("/user/image", fbAuth, uploadimage);
app.get("/user", fbAuth, getAuthenticatedUser);
app.post("/user", fbAuth, userDetails);
app.get("/user/:handle", getUserDetails);
app.post("/notification", fbAuth, markNotificationsRead);

exports.api = functions.region("asia-east2").https.onRequest(app);
exports.createNotificationOnLike = functions
  .region("asia-east2")
  .firestore.document("postlikes/{id}")
  .onCreate(snapshot => {
    return db
      .doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then(doc => {
        if (!doc.exists) {
          return res.status(404).json({ error: "not found" });
        }
         
        return db.doc(`/notifications/${snapshot.id}`).set({
          reception: doc.data().userHandle,
          sender: snapshot.data().userHandle,
          read: false,
          screamId: doc.id,
          type: "like",
          createdAt: new Date().toISOString()
        });
      
      })
  
      .catch(err => {
        console.err(err);
        return;
      });
  });

exports.deleteNotificationsOnUnlike = functions
  .region("asia-east2")
  .firestore.document(`postlikes/{id}`)
  .onDelete(snapshot => {
    return db
      .doc(`/notifications/${snapshot.id}`)
      .delete()
      .catch(err => {
        console.err(err);
        return;
      });
  });

exports.createNotificationOnComment = functions
  .region("asia-east2")
  .firestore.document("postcomments/{id}")
  .onCreate(snapshot => {
    return db
      .doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then(doc => {
        if (!doc.exists) {
          return res.status(404).json({ error: "not found" });
        }
          return db.doc(`/notifications/${snapshot.id}`).set({
            reception: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            read: false,
            screamId: doc.id,
            type: "comment",
            createdAt: new Date().toISOString()
          });
        
      })

      .catch(err => {
        console.err(err);
        return;
      });
  });

  exports.onUserImageChange = functions
  .region('asia-east2')
  .firestore.document('/users/{userId}')
  .onUpdate((change) => {
    console.log(change.before.data());
    console.log(change.after.data());
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      console.log('image has changed');
      const batch = db.batch();
      return db
        .collection('screams')
        .where('userHandle', '==', change.before.data().handle)
        .get()
        .then((data) => {
          data.forEach((doc) => {
            const scream = db.doc(`/screams/${doc.id}`);
            batch.update(scream, { userImage: change.after.data().imageUrl });
          });
          return batch.commit();
        });
    } else return true;
  });

exports.onScreamDelete = functions
  .region('asia-east2')
  .firestore.document('/screams/{screamId}')
  .onDelete((snapshot, context) => {
    const screamId = context.params.screamId;
    const batch = db.batch();
    return db
      .collection('postcomments')
      .where('screamId', '==', screamId)
      .get()
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/postcomments/${doc.id}`));
        });
        return db
          .collection('postlikes')
          .where('screamId', '==', screamId)
          .get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/postlikes/${doc.id}`));
        });
        return db
          .collection('notifications')
          .where('screamId', '==', screamId)
          .get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/notifications/${doc.id}`));
        });
        return batch.commit();
      })
      .catch((err) => console.error(err));
  });