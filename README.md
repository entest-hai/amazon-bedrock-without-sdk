---
title: how to call amazon bedrock without using sdk
author: haimran
date: 10/03/2024
---

## Introduction

- Create a HTTP request sending to Bedrock runtime endpoint
- Sign the request using AWS Signature V4
- Process the stream response chunk by chunk and decode text

## Create Request

Let create a HTTP request sendin to the Bedrock runtime endpoint

```js
const urlBedrockStream =
  "https://bedrock-runtime.us-east-1.amazonaws.com/model/anthropic.claude-v2/invoke-with-response-stream";

const request = new HttpRequest({
  method: "POST",
  protocol: "https:",
  hostname: new URL(urlBedrockStream).hostname,
  path: new URL(urlBedrockStream).pathname,
  headers: {
    host: new URL(urlBedrockStream).hostname,
    // Accept: "application/vnd.amazon.eventstream",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    prompt: "\n\nHuman: How to cook chicken soup? \n\nAssistant: ",
    max_tokens_to_sample: 2048,
  }),
});
```

## Signed Request

The request must be signed using AWS Signature V4.

```js
// load credentials using fromIni
const credentials = fromIni({ profile: "demo" });
const creds = await credentials.call();

// create a signer using signature v4
const signer = new SignatureV4({
  service: "bedrock",
  region: "us-east-1",
  credentials: {
    accessKeyId: creds.accessKeyId,
    secretAccessKey: creds.secretAccessKey,
    sessionToken: creds.sessionToken,
  },
  sha256: Sha256,
});

// sign the request
const signedRequest = await signer.sign(request);
```

## Process Response

The stream response is a stream, we need to process it chunk by chunk. In addition, the text answer is encoded in based64, so need to extract it using regex and decode.

```js
let answer = "";
const regex = /\{(.*?)\}/g;
let match;

while (true) {
  // read a chunk of byte
  const { done, value } = await reader.read();
  if (done) {
    console.log("Stream complete");
    break;
  }

  // decode
  const x = decoder.decode(value);

  // regex to get wanted data
  try {
    while ((match = regex.exec(x)) !== null) {
      const y = "{" + match[1] + "}";

      // base64 decode to text
      const z = atob(JSON.parse(y).bytes);
      console.log(JSON.parse(z).completion);
      answer += JSON.parse(z).completion;
    }
  } catch (error) {
    console.log(error);
    // append to final answer
    answer += "ERROR";
  }
}
```
