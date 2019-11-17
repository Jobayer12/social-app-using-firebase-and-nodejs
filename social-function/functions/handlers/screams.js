const { db } = require("../util/admin");
exports.getAllScreams = (request, response) => {
  db.collection("screams")
    .orderBy("createdAt", "desc")
    .get()
    .then(data => {
      let screams = [];
      data.forEach(element => {
        screams.push({
          screamsId: element.id,
          body: element.data().body,
          userHandle: element.data().userHandle,
          createdAt: element.data().createdAt,
          commentCount:element.data().commentCount,
          likeCount:element.data().likeCount,
          userImage:element.data().userImage
        });
      });

      return response.json(screams);
    })
    .catch(err => console.error(err));
};

exports.postOneScreams = (req, res) => {
  const newScreams = {
    body: req.body.body,
    userHandle: req.user.handle,
    userImage: req.user.imageUrl,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0
  };

  db.collection("screams")
    .add(newScreams)
    .then(data => {
      const resScream = newScreams;
      resScream.screamId = data.id;

      return res.json(resScream);
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: "something wrong" });
    });
};

exports.getScream = async (req, res) => {
  let screamData = {};
  db.doc(`/screams/${req.params.screamId}`)
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Scream not found" });
      }
      screamData = doc.data();
      screamData.screamId = doc.id;
      return db
        .collection("postcomments")
        .where("screamId", "==", req.params.screamId)
        .get();
    })
    .then(snapshot => {
      screamData.comments = [];
      snapshot.forEach(doc => {
        screamData.comments.push(doc.data());
      });

      return res.json(screamData);
    })
    .catch(err => {
      return res.status(500).json({ error: err.code });
    });
};

exports.commentOnScream = (req, res) => {
  if (req.body.body.trim() === "")
    return res.status(400).json({ comment: "Must not be empty" });

  const newComment = {
    body: req.body.body,
    createdAt: new Date().toISOString(),
    screamId: req.params.screamId,
    userHandle: req.user.handle,
    userImage: req.user.imageUrl
  };
  console.log(newComment);

  db.doc(`/screams/${req.params.screamId}`)
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Scream not found" });
      }
      return doc.ref.update({ commentCount: doc.data().commentCount + 1 });
    })
    .then(() => {
      return db.collection("postcomments").add(newComment);
    })
    .then(() => {
      return res.json(newComment);
    })
    .catch(err => {
      console.log(err);
      return res.status(500).json({ error: "Something went wrong" });
    });
};

exports.likeScream = (req, res) => {
  const likeDocument = db
    .collection("postlikes")
    .where("userHandle", "==", req.user.handle)
    .where("screamId", "==", req.params.screamId)
    .limit(1);
  const screamDocument = db.doc(`/screams/${req.params.screamId}`);

  let screamData;

  screamDocument
    .get()
    .then(data => {
      if (data.exists) {
        screamData = data.data();
        screamData.screamId = data.id;
        return likeDocument.get();
      } else {
        return res.status(500).json({ error: "Scream Not Found" });
      }
    })
    .then(async data1 => {
      if (data1.empty) {
        return await db
          .collection("postlikes")
          .add({
            screamId: req.params.screamId,
            userHandle: req.user.handle
          })
          .then(() => {
            screamData.likeCount++;
            return screamDocument.update({ likeCount: screamData.likeCount });
          })
          .then(() => {
            return res.json(screamData);
          });
      } else {
        return res.status(400).json({ error: "Scream Already Liked" });
      }
    })
    .catch(err => {
      return res.status(500).json({ error: err.code });
    });
};

exports.unlikeScream = (req, res) => {
  const likeDocument = db
    .collection("postlikes")
    .where("userHandle", "==", req.user.handle)
    .where("screamId", "==", req.params.screamId)
    .limit(1);
  const screamDocument = db.doc(`/screams/${req.params.screamId}`);

  let screamData;
  screamDocument
    .get()
    .then(data => {
      if (data.exists) {
        screamData = data.data();
        screamData.screamId = data.id;
        return likeDocument.get();
      } else {
        return res.status(500).json({ error: "Scream Not Found" });
      }
    })
    .then(data1 => {
      if (data1.empty) {
        return res.status(400).json({ error: "Scream Already Liked" });
      } else {
        return db
          .doc(`/postlikes/${data1.docs[0].id}`)
          .delete()
          .then(() => {
            screamData.likeCount--;
            return screamDocument.update({ likeCount: screamData.likeCount });
          })
          .then(() => {
            return res.json(screamData);
          });
      }
    })
    .catch(err => {
      return res.status(500).json({ error: err.code });
    });
};

exports.deleteScream = (req, res) => {
  const document = db.doc(`/screams/${req.params.screamId}`);
  document
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Scream Not found" });
      }
      if (doc.data().userHandle !== req.user.handle) {
        return res.status(403).json({ error: "UnAuthorized" });
      } else {
        return document.delete();
      }
    })
    .then(() => {
      return res.json({ message: "deleted successfully" });
    }).catch(err=>{
      return res.status(500).json({ error: err.code });
    })
};
