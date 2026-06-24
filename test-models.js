const OpenAI = require("openai");

const client = new OpenAI({
  baseURL: "https://api.tokenrouter.com/v1",
  apiKey: "sk-AOt67meuELDInKqIzth57o1PvyyZ3O8tz5ZjJ21Fwz2sHkw0",
});

const models = [
  "MiniMax-M3",
  "minimax-m3"
];

async function test() {
  for (const model of models) {
    console.log(`Testing model: ${model} on TokenRouter...`);
    try {
      const completion = await client.chat.completions.create({
        messages: [{ role: "user", content: "Say hello in one word" }],
        model: model,
      });
      console.log(`SUCCESS: ${model} -> ${completion.choices[0].message.content.trim()}`);
    } catch (err) {
      console.log(`FAILED: ${model} -> ${err.message}`);
    }
  }
}

test();
