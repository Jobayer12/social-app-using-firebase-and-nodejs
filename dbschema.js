let db = {
  users: [
    {
      userId: "Zq2ugnYpouMEWYDPU38k9EgqqpI2",
      email: "jobayer@gmail.com",
      handle: "jobayer",
      createdAt: "2019-08-29T11:38:39.252Z",
      imageUrl: "image/vnssv/image.png",
      bio: "Hello i am new in here",
      website: "google.com",
      location: "Dhaka,Bangladesh"
    }
  ],

  screams: [
    {
      userHandle: "user",
      body: "this is scream body",
      createdAt: "2019-08-25T10:52:42.140Z",
      likeCount: 5,
      commentCount: 2
    }
  ],
  comments:[
    {
      userHandle: "user",
      screamId:"Zq2ugnYpouMEWYDPU38k9EgqqpI2",
      body: "this is scream body",
      createdAt: "2019-08-25T10:52:42.140Z"
    }
  ],
  notifications:[
    {
      reception:'user',
      sender:'jobayer',
      read:'true|false',
      screamId:"Zq2ugnYpouMEWYDPU38k9EgqqpI2",
      type:'like|comment',
      createdAt: "2019-08-25T10:52:42.140Z"
    }
  ]
};

const userDetails={

  credentials:{
    userId: "Zq2ugnYpouMEWYDPU38k9EgqqpI2",
    email: "jobayer@gmail.com",
    handle: "jobayer",
    createdAt: "2019-08-29T11:38:39.252Z",
    imageUrl: "image/vnssv/image.png",
    bio: "Hello i am new in here",
    website: "google.com",
  },
  likes:[
    {
      userHandle:'user',
      screamId:'kj nksn ksnkns'
    },
    {
      userHandle:'user',
      screamId:'kj nksn ksnkns'
    },
  ]

}
