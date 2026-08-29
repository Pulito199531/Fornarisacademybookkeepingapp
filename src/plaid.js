const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');

const configured = !!(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET);

let client = null;
if (configured) {
  const config = new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
        'PLAID-SECRET': process.env.PLAID_SECRET,
      },
    },
  });
  client = new PlaidApi(config);
}

module.exports = { client, configured };
