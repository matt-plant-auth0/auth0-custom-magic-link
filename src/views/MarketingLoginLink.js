import React, { useEffect, useState } from "react";
import { Alert, Form, FormGroup, Input, Label, Button, Container } from "reactstrap";
import * as Cookies from 'es-cookie';
import { getConfig } from "../config";
import { useHistory, useLocation } from 'react-router-dom';

import Loading from "../components/Loading";

export const MarketingLinkComponent = (props) => {
  const params = new URLSearchParams(window.location.search);
  const [email, setEmail] = useState('');
  const [campaignID, setCampaignID] = useState('');
  const [loginLink, setLoginLink] = useState('');
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const CACHE_KEY_PREFIX = '@@auth0spajs@@';
  const history = useHistory();

  const decodeB64 = (input) => {
    return decodeURIComponent(
      atob(input)
        .split('')
        .map(c => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
  }
  const urlDecodeB64 = (input) => {
    return decodeB64(input.replace(/_/g, '/').replace(/-/g, '+'));
  }
    

  const idTokendecoded = [
    'iss',
    'aud',
    'exp',
    'nbf',
    'iat',
    'jti',
    'azp',
    'nonce',
    'auth_time',
    'at_hash',
    'c_hash',
    'acr',
    'amr',
    'sub_jwk',
    'cnf',
    'sip_from_tag',
    'sip_date',
    'sip_callid',
    'sip_cseq_num',
    'sip_via_branch',
    'orig',
    'dest',
    'mky',
    'events',
    'toe',
    'txn',
    'rph',
    'sid',
    'vot',
    'vtm'
  ];

  const decodeToken = (token) => {
    const parts = token.split('.');
    const [header, payload, signature] = parts;
  
    if (parts.length !== 3 || !header || !payload || !signature) {
      throw new Error('ID token could not be decoded');
    }
    const payloadJSON = JSON.parse(urlDecodeB64(payload));
    const claims = { __raw: token };
    const user = {};
    Object.keys(payloadJSON).forEach(k => {
      claims[k] = payloadJSON[k];
      if (!idTokendecoded.includes(k)) {
        user[k] = payloadJSON[k];
      }
    });
    return {
      encoded: { header, payload, signature },
      header: JSON.parse(urlDecodeB64(header)),
      claims,
      user
    };
  };

  const createCacheKey = (client_id, audience, scope) => {
    return `${CACHE_KEY_PREFIX}::${client_id}::${audience}::${scope}`;
  }

  const createCacheEntry = (idToken, accessToken, expiresIn, audience, scope, clientId, refreshToken) => {
    const decodedToken = decodeToken(idToken);

    const now = Date.now();
    const expiresInTime = Math.floor(now / 1000) + expiresIn;

    const expirySeconds = Math.min(
      expiresInTime,
      decodedToken.claims.exp
    );

    return {
      body: {
        id_token: idToken,
        access_token: accessToken,
        expires_in: expiresIn,
        decodedToken: decodedToken,
        audience: audience,
        scope: scope,
        client_id: clientId,
        refresh_token: refreshToken
      },
      expiresAt: expirySeconds
    }
  }

  useEffect(() => {
    async function loginWithLink() {
      try {
        let res = await fetch("http://localhost:3001/api/ropg", {
          method: "POST",
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            token: params.get('token')
          }),
        });
        let resJson = await res.json();
        if (res.status === 200) {
          setUserData(resJson.userData);
          let cacheKey = createCacheKey(getConfig().clientId, (resJson.audience ? resJson.audience : `https://${resJson.domain}/api/v2/`), resJson.userData.scope);
          let cacheEntry = createCacheEntry(resJson.userData.id_token, resJson.userData.access_token, resJson.userData.expires_in, (resJson.audience ? resJson.audience : `https://${resJson.domain}/api/v2/`), resJson.userData.scope, getConfig().clientId, resJson.userData.refresh_token);
          localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
          //auth0.7mRIJ6CjBrcuWr9HMsIBIhSiyE3B3liT.is.authenticated
          Cookies.set(`auth0.${getConfig().clientId}.is.authenticated`, true);
          console.log("Redirecting to profile page...");
          window.location.replace("/profile");
        }else{
          console.log(resJson);
          setError(resJson);
          setUserData(true);
        }
      } catch (err) {
        console.log(err);
        setError(err);
        setUserData(true);
      }
    }
    if(params.has('token')){
      loginWithLink();
    }
  }, [params.entries]);

  const generateJWT = async (e) => {
    e.preventDefault();
    setError(null);
    setUserData(null);
    params.delete('token');
    history.replace({
      search: params.toString(),
    })
    try {
      let res = await fetch("http://localhost:3001/api/marketing-link", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          campaignID: campaignID
        }),
      });
      let resJson = await res.json();
      if (res.status === 200) {
        setEmail('');
        setCampaignID('');
        setLoginLink(resJson.link);
      }
    } catch (err) {
      console.log(err);
    }
  };

  if(params.has('token') && !userData){
    return <Loading />;
  }

  return (
    <Container className="mb-5">
      <Form>
        <FormGroup>
          <Label for="email">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            placeholder="Email address"
            type="email"
            onChange={(e) => setEmail(e.target.value)}
          />
        </FormGroup>
        <FormGroup>
          <Label for="campaignID">
            Campaign ID
          </Label>
          <Input
            id="campaignID"
            name="campaignID"
            placeholder="Campaign ID"
            type="text"
            onChange={(e) => setCampaignID(e.target.value)}
          />
        </FormGroup>
        <Button
            color="primary"
            onClick={generateJWT}
        >
          Submit
        </Button>
      </Form>
      {loginLink && (
        <Alert>
          Login link successfully generated: {' '}
          <a
            className="alert-link"
            href={loginLink}
          >
            {loginLink}
          </a>
        </Alert>
      )}
      {error && (
        <Alert color="danger">
          Oops! An error occured: {' '}
          <pre>{error.message}</pre>
        </Alert>
      )}
    </Container>
  );
};

export default MarketingLinkComponent;
