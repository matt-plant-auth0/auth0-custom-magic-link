function login(email, password, callback) {
	const jwt = require("jsonwebtoken");
  try {
    var decoded = jwt.verify(password, 'S3cr3t!');
    callback(null, {
    	user_id: Buffer.from(`${decoded.email}+${decoded.campaignID}`)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, ''),
    	email: email,
      app_metadata: {
        campaignID: decoded.campaignID
    	}
		});
  } catch(err) {
  	callback(err);
	}
}