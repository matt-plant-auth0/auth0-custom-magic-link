import React from "react";

import logo from "../assets/logo.svg";

const Hero = () => (
  <div className="text-center hero my-5">
    <img className="mb-3 app-logo" src={logo} alt="React logo" width="120" />
    <h1 className="mb-4">Marketing Magic Link</h1>

    <p className="lead">
      This is an example of an application that can utilise a bulk generated magic link for authenticating users - most likely this link would be present in marketing campaigns.
    </p>
  </div>
);

export default Hero;
