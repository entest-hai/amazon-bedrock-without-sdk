// call bedrock without using sdk
// let using Amazon Q and CodeWhisperer to agument developers :))))
// 1. create a http request to bedrock endpoint
// 2. sign the request using signature v4
// 3. send the request to bedrock endpoint
// 4. parse and process stream response chunk by chunk

import { fromIni } from "@aws-sdk/credential-provider-ini";
import { HttpRequest } from "@aws-sdk/protocol-http";
import { SignatureV4 } from "@smithy/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-js";

// bedrock stream url
const urlBedrockStream =
  "https://bedrock-runtime.us-east-1.amazonaws.com/model/anthropic.claude-v2/invoke-with-response-stream";

// load credentials using fromIni
const credentials = fromIni({ profile: "demo" });
const creds = await credentials.call();

// create a http request to bedrock endpoint
// use my previous code for faster demo
// but it does suggest well
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

// create a function to send a request to bedrock endpoint using fetch

const callBedrockStream = async () => {
  // sign the request using signature v4
  const signedRequest = await signer.sign(request);

  // send the request to bedrock endpoint
  const response = await fetch(urlBedrockStream, signedRequest);

  // parse and process stream response chunk by chunk
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  // loop to read reader and process chunk by chunk
  // it return base64 data so we need to
  // capture wanted data using regex
  // decode based64 to get text
  // let modify a bit

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

  console.log(answer);
};

// main to test
const main = async () => {
  await callBedrockStream();
};

main();

// DONE
