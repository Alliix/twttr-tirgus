const fs = require("fs");

const readTweetsLength = () => {
  const dir = "./brandTweets";
  let allNeutral = 0;
  let allPositive = 0;
  let allNegative = 0;
  let allLabeledLength = 0;
  let allLength = 0;
  fs.readdir(dir, (err, files) => {
    if (err) {
      throw err;
    }

    files.forEach((file) => {
      let tweets = fs.readFileSync(`${dir}/${file}`, "utf-8");
      tweets = JSON.parse(tweets);
      allLength += tweets.length;
      console.log(`${file}: ${tweets.length} tweets`);
      tweets = tweets.filter((tweet) => tweet.label != null);
      allNeutral += tweets.filter((tweet) => tweet.label === 0).length;
      allPositive += tweets.filter((tweet) => tweet.label === 1).length;
      allNegative += tweets.filter((tweet) => tweet.label === 2).length;
      console.log(`${file}: ${tweets.length} labeled tweets`);
      allLabeledLength += tweets.length;
    });
    console.log("All length: " + allLength);
    console.log("All labeled length: " + allLabeledLength);
    console.log("All neutral length: " + allNeutral);
    console.log("All positive length: " + allPositive);
    console.log("All negative length: " + allNegative);
  });
};

readTweetsLength();
