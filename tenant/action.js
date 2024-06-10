/**
* Handler that will be called during the execution of a PostLogin flow.
*
* @param {Event} event - Details about the user and the context in which they are logging in.
* @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
*/
exports.onExecutePostLogin = async (event, api) => {
    const ManagementClient = require('auth0').ManagementClient;
    const auth0 = new ManagementClient({
      domain: 'YOUR_AUTH0_TENANT_DOMAIN',
      clientId: 'YOUR_MANAGEMENT_API_APP_CLIENT_ID',
      clientSecret: event.secrets.managementClient //YOUR_MANAGEMENT_API_APP_SECRET
    });
  
    const findDuplicates = () => {
      return new Promise((resolve, reject) => {
        const params = {
          search_engine: 'v3',
          q: `email:"${event.user.email}"`
          // q: `email:"${event.user.email}" AND email_verified:true`
          // q: `name:"${event.user.name}"`
        };
  
        auth0.users.getAll(params, (err, users) => {
          users = users ? users : [];
          resolve(users.filter(x => x.user_id !== event.user.user_id));
        });
      });
    };
  
    const mergeUsers = (id, provider) => {
      return new Promise((resolve, reject) => {
        const userId = event.user.user_id;
        var params = {
          // @ts-ignore
          user_id: id,
          provider
        };
        
        auth0.users.link(userId, params, (err, user) => {
          if (err) {
            console.log(err);
          }
  
          console.log('The accounts have been linked.');
          resolve();
        });
      });
    };
  
    const mergeMetaData = (user_metadata, app_metadata) => {
      return new Promise((resolve, reject) => {
        // @ts-ignore
        auth0.users.update({ id: event.user.user_id }, {
          // @ts-ignore
          user_metadata: user_metadata,
          // @ts-ignore
          app_metadata: app_metadata
        }, (err, user) => {
          if (err) {
            console.log(err);
          }
  
          console.log('User metadata merged.');
          resolve();
        });
      });
    };
  
    if(event.connection.name === 'YOUR_CUSTOM_MAGIC_LINK_DB_CONNECTION'){
      console.log(`login count for ${event.user.user_id}: ${event.stats.logins_count}`);
      const user = await findDuplicates();
      // @ts-ignore
      if (user.length === 1) {
        console.log(user);
  
        const user_id = user[0].user_id;
        const provider = user[0].identities[0].provider;
        const user_metadata = user[0].user_metadata;
        const app_metadata = user[0].app_metadata;
  
        await mergeUsers(user_id, provider);
        await mergeMetaData(user_metadata, app_metadata);
        
      } else {
        console.log('Skipping Account Linking flow.');
        if(event.stats.logins_count > 1){
          api.access.deny("Email magic links are one-time use only - this link has already been used. Please request a new link.");
        }
      }
      
      api.accessToken.setCustomClaim('http://YOUR_DOMAIN/claim', {
        marketingAccess: true
      });
      api.idToken.setCustomClaim('http://YOUR_DOMAIN/claim',{
        marketingCampaign: event.user.app_metadata.campaignID
      })
    }
  };
  
  
  /**
  * Handler that will be invoked when this action is resuming after an external redirect. If your
  * onExecutePostLogin function does not perform a redirect, this function can be safely ignored.
  *
  * @param {Event} event - Details about the user and the context in which they are logging in.
  * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
  */
  // exports.onContinuePostLogin = async (event, api) => {
  // };