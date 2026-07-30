async function test() {
  try {
    const response = await fetch("https://api.thesys.dev/v1/models", {
      headers: {
        "Authorization": "Bearer sk-th-l13FYUrBEX3ix9KprH060u5K1l0iJvX5xaudcY0GviC7RsT9W355grM6inithORzQ80nojA0rUu1Wdob0r61eJzmZBUbzYy6Rd0d"
      }
    });
    const json = await response.json();
    console.log(JSON.stringify(json, null, 2));
  } catch (err) {
    console.error(err);
  }
}

test();
