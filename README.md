# Auth0 Custom Magic Link

This project is based on the Auth0 React sample application, and demonstrates how a marketing system could generate a custom magic link to authenticate users with Auth0. The project has certain requirements and dependancies which need to be setup in Auth0 and the NodeJS environment variables.


# Auth0 Tenant Setup

For this project to function correctly you will need the following setup in your tenant:

1) A Single Page Application, which the front-end of this project will communicate with using the React SDK

    a) This will need refresh tokens enabled

2) A Regular Web Application, which the back-end will communicate with using the NodeJS SDK

    a) This will need refresh tokens enabled, and the Password grant allowed in the advanced settings

3) A custom DB connection, with lazy migration disabled and 'Sync user profile attributes at each login' enabled

    a) This will require custom login & delete scripts - please see 'tenant' folder in project

4) An API setup for the back-end application

    a) This will also need refresh tokens enabled

5) An Action created to facilitate

    a) Silent account linking

    b) Adding custom claims to the tokens

    c) Denying access for already used links

An example of this can be found in the 'tenant' folder in this project.


# Node .env Vars

DOMAIN=Your Auth0 tenant domain

CLIENT_ID=Your Auth0 management API client ID

CLIENT_SECRET=Your Auth0 management API secret

ROPG_CLIENT=Your custom magic link application's client ID

ROPG_SECRET=Your custom magic link application's secret

SPA_AUDIENCE=Your SPA application's API audience

ROPG_REALM=Your custom magic link DB connection name


# Custom Magic Link DB Clean-up

As part of the back-end, there is an API endpoint to clear the custom magic link DB to aid in testing - this will also remove any linked accounts where possible.