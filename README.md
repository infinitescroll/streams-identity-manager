instructions for running this, locally, in dev mode

1. `git clone git@github.com:openworklabs/streams-identity-manager.git && cd streams-identity-manager && npm i`
2. `npm run start:ipfs` - starts a long running IPFS daemon, don't kill this process
3. In a new terminal, `npm run start:ceramic` = starts a long running ceramic daemon, don't kill this process
4. Run once, to create schemas and definitions and push them to ceramic: `npm run write:definitions`

After step 4, you should have `publishedSchemas.json` and `definitions.json` in your repo root. You only need to do this step once when running the identity-manager. If you restart your ceramic daemon and IPFS node, run `npm run write:definitions` again.

5. `npm run start:dev` fires up the identity manager

---

Acquire an all-access JWT:

1. Request permission:

```curl
curl --location --request POST 'localhost:3001/rpc/v0' \
--header 'Content-Type: application/json' \
--data-raw '{
"jsonrpc": "2.0",
"method": "Identity.RequestPermission",
"id": 1,
"params": ["youremail@openworklabs.com"]
}'
```

This will return a JWT. You will need this JWT for step2.

2. Go to your email, grab the code that was sent to you

```curl
curl --location --request POST 'localhost:3001/rpc/v0' \
--header 'Authorization: Bearer TOKEN_FROM_STEP1' \
--header 'Content-Type: application/json' \
--data-raw '{
"jsonrpc": "2.0",
"method": "Identity.Consent",
"id": 1,
"params": [EMAIL_FROM_STEP1, CODE_SENT_TO_YOUR_EMAIL]
}'
```

You will get back another JWT, this JWT you can use to make authenticated requests.
