### Scenario 1 - application wants to get data from 1 database on the user

Headers: {
Authorization: Bearer <token>
}

token ^^

{ email: schwartzz8990@gmail.com, did: did:3:dsjakofhdjskoah, appID: did:3:45678 }

(note, ceramic docs in this file have simplified IDs to make them easier to understand/visually parse. In real life, all ceramic docs are instinguishable to the human eye)

Step 1. The application "did:3:45678" is asking for the content behind "ceramic://threaddoc2", should we send a `200` with the content or a `403`?

`````json
// this is the user's IDX root - aka: ceramic://idx-root
{
  "databases": "ceramic://threads12345", // => Database[]
  "permissions": "ceramic://permissions12345", // => Permission[]
}

Note, the reason we do it this way ^^^, is so that we limit the number of IDX mutations we make. We ideally want to make 0 IDX mutations after the user gets created (where we fill in the databases and permissions pointers to empty docs)

- first we have to resolve the permissions...
```json
{
  "permissions": [
    // a simple app with access to 1 thread
    {
      "did": "did:3:12345",
      "scopes": ["ceramic://threaddoc1"]
    },
    // a simple app with access to multiple thread
    {
      "did": "did:3:45678",
      "scopes": ["ceramic://threaddoc1", "ceramic://threaddoc2", "ceramic://threaddoc3"]
    },
    // the PDM, with root level access
    {
      "did": "did:3:9876",
      "scopes": ["*"]
    },
    // an app that just got consent from the user to create dbs, but none have been created yet(common use case)
    {
      "did": "did:3:1515",
      "scopes": []
    },
    // another streams user
    {
      "did": "did:3:user123",
      "scopes": ["ceramic://threaddoc1"]
    }
  ]
}
```

Answer: 200!
- did:3:45678 does have scope to access "ceramic://threaddoc1"

### Scenario 2 - application requests permission and gets consent to access a database

Step 1. The application "did:3:10000" just received consent to access "ceramic://threaddoc1", does the permission already exist?

````json
// this is the user's IDX root - aka: ceramic://idx-root
{
  "databases": "ceramic://threads12345",
  "permissions": "ceramic://permissions12345",
}

Note, the reason we do it this way ^^^, is so that we limit the number of IDX mutations we make. We ideally want to make 0 IDX mutations after the user gets created (where we fill in the databases and permissions pointers to empty docs)

- first we have to resolve the permissions...
```json
{
  "permissions": [
    // a simple app with access to 1 thread
    {
      "did": "did:3:12345",
      "scopes": ["ceramic://threaddoc1"]
    },
    // a simple app with access to multiple thread
    {
      "did": "did:3:45678",
      "scopes": ["ceramic://threaddoc1", "ceramic://threaddoc2", "ceramic://threaddoc3"]
    },
    // the PDM, with root level access
    {
      "did": "did:3:9876",
      "scopes": ["*"]
    },
    // an app that just got consent from the user to create dbs, but none have been created yet(common use case)
    {
      "did": "did:3:10000",
      "scopes": ["ceramic://threaddoc1"]
    },
    // another streams user
    {
      "did": "did:3:user123",
      "scopes": ["ceramic://threaddoc1"]
    }
  ]
}
```

Answer: no!
- did:3:10000 does not have a scope with "ceramic://threaddoc1" in it

Step 2. Grant permission to did:3:10000
1. Resolve "ceramic://threaddoc1"

> ```json
{
  "name": "my first database",
  "threadID": "LikeMike23",
  "permissions": "cermaic
}
```

2. Resolve the secret doc @"ceramic://secretdoc1"

>```json
// ceramic://secretdoc1 - "secret"
fdjsaofihjdsaohfjdsaofh
```

3. Decrypt the secret doc with the user's DID, into...

```json
{
  "encryptedServiceKey": "xxxxyyyzzz",
  "encryptedReadKey": "rrrriiiilllmmm"
}
```

4. Reencrypt the doc, so that only the key holders of the DID which requested access to this permission can decrypt it
>```json
fzdrdwarewatdsaz435nsjn
```

5. Add this doc to ceramic
// ceramic://secretdoc3 - "secret"

6. Now, if you're an application with a DID, you can take "ceramic://secretdoc3" and add that to your own DID... (or we can do that for you, if we own the DID of the app (which i think we will))
`````
