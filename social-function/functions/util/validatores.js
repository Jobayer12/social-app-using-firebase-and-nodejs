const isEmail = email => {
  let reqEx = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/;
  if (email.match(reqEx)) return true;
  else return false;
};

const isEmpty = string => {
  if (string.trim() === "") return true;
  else return false;
};

exports.vaidationDataSignUp = newuser => {
  let errors = {};
  if (isEmpty(newuser.email)) {
    errors.email = "email must not be empty";
  } else if (!isEmail(newuser.email)) {
    errors.email = "Must be a valid email address";
  }

  if (isEmpty(newuser.password)) errors.password = "password must not be empty";
  if (newuser.password !== newuser.confirmPassword)
    errors.confirmPassword = "password not match";
  if (isEmpty(newuser.handle)) errors.handle = "handle must not be empty";

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false
  };
};

exports.vaidationDataLogin = user => {
  let errors = {};
  if (isEmpty(user.email)) errors.email = "Email must not be empty";
  if (isEmpty(user.password)) errors.password = "password must not be empty";

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false
  };
};

exports.reduceUserDetails = data => {
  let userDetails = {};

  if (!isEmpty(data.bio.trim())) userDetails.bio = data.bio;
  if (!isEmpty(data.website.trim())) {
    if (data.website.trim().substring(0, 4) !== "http") {
      userDetails.website = `http://${data.website.trim()}`;
    } else userDetails.website = data.website;
  }
  if (!isEmpty(data.location.trim())) userDetails.location = data.location;

  return userDetails;
  
};
