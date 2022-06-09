import React, { useEffect, useState } from "react";
import { Container, Row, Col } from "reactstrap";
import jwt from 'jwt-decode';

import Highlight from "../components/Highlight";
import Loading from "../components/Loading";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";

export const ProfileComponent = () => {
  const [token, setToken] = useState(null);
  const { user, getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    async function getToken() {
      try{
        console.log('Getting access token...');
        let rawToken = await getAccessTokenSilently({});
        console.log(rawToken);
        let accessToken = jwt(rawToken);
        setToken(accessToken);
      } catch (e) {
        console.log(e);
        setToken({error: 'Access token is opaque or cannot be decoded'});
      }
    }
    getToken();
  },[getAccessTokenSilently]);
  
  if (!token) {
    return <Loading />;
  }

  return (
    <Container className="mb-5">
      <Row className="align-items-center profile-header mb-5 text-center text-md-left">
        <Col md={2}>
          <img
            src={user.picture}
            alt="Profile"
            className="rounded-circle img-fluid profile-picture mb-3 mb-md-0"
          />
        </Col>
        <Col md>
          <h2>{user.name}</h2>
          <p className="lead text-muted">{user.email}</p>
        </Col>
      </Row>
      <Row>
        <h2>ID Token</h2>
        <Highlight>{JSON.stringify(user, null, 2)}</Highlight>
      </Row>
      <Row>
        <h2>Access Token</h2>
        <Highlight>{JSON.stringify(token, null, 2)}</Highlight>
      </Row>
    </Container>
  );
};

export default withAuthenticationRequired(ProfileComponent, {
  onRedirecting: () => <Loading />,
});
