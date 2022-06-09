require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const jwt = require("express-jwt");
const jwksRsa = require("jwks-rsa");
const fetch = require("node-fetch");
const ManagementClient = require('auth0').ManagementClient;
const AuthenticationClient = require('auth0').AuthenticationClient;
const authConfig = require("./src/auth_config.json");
const jwtGen = require("jsonwebtoken");

const app = express();

const port = process.env.API_PORT || 3001;
const appPort = process.env.SERVER_PORT || 3000;
const appOrigin = authConfig.appOrigin || `http://localhost:${appPort}`;

if (
  !authConfig.domain ||
  !authConfig.audience ||
  authConfig.audience === "YOUR_API_IDENTIFIER"
) {
  console.log(
    "Exiting: Please make sure that auth_config.json is in place and populated with valid domain and audience values"
  );

  process.exit();
}

app.use(morgan("dev"));
app.use(helmet());
app.use(cors({ origin: appOrigin }));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${authConfig.domain}/.well-known/jwks.json`,
  }),

  audience: authConfig.audience,
  issuer: `https://${authConfig.domain}/`,
  algorithms: ["RS256"],
});

app.get("/api/external", checkJwt, (req, res) => {
  res.send({
    msg: "Your access token was successfully validated!",
  });
});

app.get("/api/management", checkJwt, async (req, res) => {
  const managementClient = new ManagementClient({
      domain: process.env.DOMAIN,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      scope: 'read:organizations'
  });

  let orgs = await managementClient.users.getUserOrganizations({id: req.user.sub});
  
  res.send(orgs);
});

app.post("/api/marketing-link", (req, res) => {
  var token = jwtGen.sign({ email: req.body.email, campaignID: req.body.campaignID }, 'S3cr3t!', { expiresIn: '2 days' });
  res.send({link: `http://localhost:3000/marketing-login-link?token=${token}`});
});

app.get("/api/clean-marketing-db", async (req, res) => {
  const managementClient = new ManagementClient({
    domain: process.env.DOMAIN,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    scope: 'delete:users read:users'
  });

  let userList = await managementClient.getUsers({
    search_engine: 'v3',
    q:'identities.connection:"marketing-link"',
  });

  userList.forEach(async (user) => {
    await managementClient.deleteUser({id: user.user_id});
  });

  res.send({msg: 'All users deleted from "marketing-link"'});

});

app.post("/api/ropg", (req, res) => {
  const authClient = new AuthenticationClient({
      domain: process.env.DOMAIN,
      clientId: process.env.ROPG_CLIENT,
      clientSecret: process.env.ROPG_SECRET
  });
  try {
    var decoded = jwtGen.verify(req.body.token, 'S3cr3t!');
    authClient.passwordGrant({
      username: decoded.email,
      password: req.body.token,
      realm: 'marketing-link',
      scope: 'openid profile email offline_access',
      audience: 'http://localhost:3001/api'
    }, (err, userData) => {
      if (err) {
        console.log(err);
        res.status(500).send(err);
      } else {
        res.send({userData: userData, domain: process.env.DOMAIN, clientId: process.env.CLIENT_ID, audience: 'http://localhost:3001/api'});
      }
    });
  } catch(err) {
    console.log(err);
    res.status(500).send(err);
  }
  
});

app.listen(port, () => console.log(`API Server listening on port ${port}`));
