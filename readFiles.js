const fs = require("fs");
const { brandConfig } = require("./brandConfig.js");

const tweetIsInArray = (newTweet, existingTweets) =>
  existingTweets.length &&
  existingTweets.find(
    (existingTweet) => newTweet.tweetId === existingTweet.tweetId
  );

const foundRetweet = (newTweet, existingTweets) =>
  existingTweets.length &&
  existingTweets.find(
    (existingTweet) => newTweet.retweetedId === existingTweet.tweetId
  );

const incrementRetweetCountOnOriginalTweet = (newTweet, existingTweets) =>
  existingTweets.map((existingTweet) =>
    newTweet.retweetedId === existingTweet.tweetId
      ? {
          ...existingTweet,
          retweetCount: existingTweet.retweetCount + 1,
        }
      : existingTweet
  );

const returnRegExpStr = (searchPhrase) => {
  return `( (\\n)?(#)?${searchPhrase}(\\n)?([!"#$%&'()*+,-./:;<=>?@[\]^_\`{|}~])? )|(^(\\n)?(#)?${searchPhrase}(\\n)?([!"#$%&'()*+,-./:;<=>?@[\]^_\`{|}~])? )|( (\\n)?(#)?${searchPhrase}(\\n)?([!"#$%&'()*+,-./:;<=>?@[\]^_\`{|}~])?$)`;
};

const matchTweetMessageToRegExp = (tweetMessage, brand) => {
  let found = false;
  brand.searchNames.map((name) => {
    if (tweetMessage.match(new RegExp(returnRegExpStr(name), "ig")))
      found = true;
  });
  brand.accountNames.map((name) => {
    if (tweetMessage.match(new RegExp(returnRegExpStr(name), "ig")))
      found = true;
  });
  return found;
};

const readTweets = () => {
  const dir = "./latvian-tweet-corpus-files";
  let totalReadTweetCount = 0;
  let totalWrittenTweetCount = 0;
  fs.readdir(dir, (err, files) => {
    if (err) {
      throw err;
    }

    files.forEach((file) => {
      console.log(
        `Reading file ${file} (${files.findIndex((f) => f === file) + 1} of ${
          files.length
        })`
      );
      let newTweets = fs.readFileSync(`${dir}/${file}`, "utf-8");
      newTweets = JSON.parse(newTweets);
      console.log(`Reading ${newTweets.length} tweets`);
      totalReadTweetCount = totalReadTweetCount + newTweets.length;
      newTweets.forEach((tweet) => {
        brandConfig.forEach((brand) => {
          //------------------------------ is brand account tweet ------------------------------
          if (
            brand.accountNames.length &&
            brand.accountNames.includes(tweet.userScreenName)
          ) {
            //read existing brand tweets
            let existingBrandTweets = fs.readFileSync(brand.brandFile, "utf-8");
            existingBrandTweets = JSON.parse(existingBrandTweets);
            //check unique
            if (!tweetIsInArray(tweet, existingBrandTweets)) {
              totalWrittenTweetCount++;
              existingBrandTweets.push({
                ...tweet,
                retweetCount: 0,
                label: tweet.sentiment === -1 ? 2 : tweet.sentiment,
              });
              const tweetsBrandJson = JSON.stringify(existingBrandTweets);
              fs.writeFileSync(brand.brandFile, tweetsBrandJson, "utf-8");
            }
          }
          //------------------------------ brand is mentioned in tweet ------------------------------
          else if (matchTweetMessageToRegExp(tweet.message, brand)) {
            //read existing people tweets
            let existingPeopleTweets = fs.readFileSync(
              brand.peopleTweets,
              "utf-8"
            );
            existingPeopleTweets = JSON.parse(existingPeopleTweets);
            //check retweet
            if (tweet.retweetedId) {
              //read existing brand tweets
              let existingBrandTweets = fs.readFileSync(
                brand.brandFile,
                "utf-8"
              );
              existingBrandTweets = JSON.parse(existingBrandTweets);
              if (foundRetweet(tweet, existingBrandTweets)) {
                existingBrandTweets = incrementRetweetCountOnOriginalTweet(
                  tweet,
                  existingBrandTweets
                );
                const tweetsBrandJson = JSON.stringify(existingBrandTweets);
                fs.writeFileSync(brand.brandFile, tweetsBrandJson, "utf-8");
              } else if (foundRetweet(tweet, existingPeopleTweets)) {
                existingPeopleTweets = incrementRetweetCountOnOriginalTweet(
                  tweet,
                  existingPeopleTweets
                );
                const tweetsPeopleJson = JSON.stringify(existingPeopleTweets);
                fs.writeFileSync(brand.peopleTweets, tweetsPeopleJson, "utf-8");
              }
            }
            //check unique
            else if (!tweetIsInArray(tweet, existingPeopleTweets)) {
              totalWrittenTweetCount++;
              existingPeopleTweets.push({
                ...tweet,
                retweetCount: 0,
                label: tweet.sentiment === -1 ? 2 : tweet.sentiment,
              });
              const tweetsPeopleJson = JSON.stringify(existingPeopleTweets);
              fs.writeFileSync(brand.peopleTweets, tweetsPeopleJson, "utf-8");
            }
          }
        });
      });
      console.log(
        `Read tweets: ${totalReadTweetCount}. Written tweets: ${totalWrittenTweetCount}`
      );
    });
  });
};

const cleanFiles = () => {
  const dir = "./brandTweets";
  const dir2 = "./peopleTweets";
  // brand tweets
  fs.readdir(dir, (err, files) => {
    if (err) {
      throw err;
    }
    files.forEach((file) => {
      const tweetsEmpty = JSON.stringify([]);
      fs.writeFileSync(dir + "/" + file, tweetsEmpty, "utf-8");
    });
  });
  // people tweets
  fs.readdir(dir2, (err, files2) => {
    if (err) {
      throw err;
    }
    files2.forEach((file) => {
      const tweetsEmpty = JSON.stringify([]);
      fs.writeFileSync(dir2 + "/" + file, tweetsEmpty, "utf-8");
    });
  });
};

readTweets();
