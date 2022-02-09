const fs = require("fs");
const brandConfig = require("./brandConfig.js");

const tweetIsInArray = (newTweet, existingTweets) =>
  existingTweets.length &&
  existingTweets.find(
    (existingTweet) => newTweet.tweetId === existingTweet.tweetId
  );

const returnOriginalTweet = (newTweet, existingTweets) =>
  newTweet.retweetedId &&
  existingTweets.length &&
  existingTweets.find(
    (existingTweet) => newTweet.retweetedId === existingTweet.tweetId
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

    files.slice(2, 3).forEach((file) => {
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
        if (!tweet.inReplyToStatusId && !tweet.inReplyToUserId) {
          brandConfig.brandConfig.forEach((brand) => {
            switch (true) {
              case brand.accountNames.length &&
                brand.accountNames.includes(tweet.userScreenName):
                let existingBrandTweets = fs.readFileSync(
                  brand.brandFile,
                  "utf-8"
                );
                existingBrandTweets = JSON.parse(existingBrandTweets);
                //check unique
                if (
                  !tweetIsInArray(tweet, existingBrandTweets) &&
                  !tweet.retweetedId
                ) {
                  totalWrittenTweetCount++;
                  existingBrandTweets.push({
                    ...tweet,
                    retweetCount: 0,
                    label: tweet.sentiment
                      ? tweet.sentiment === -1
                        ? 2
                        : tweet.sentiment
                      : null,
                  });
                  const tweetsBrandJson = JSON.stringify(existingBrandTweets);
                  fs.writeFileSync(brand.brandFile, tweetsBrandJson, "utf-8");
                }
                break;
              case matchTweetMessageToRegExp(tweet.message, brand):
                let existingPeopleTweets = fs.readFileSync(
                  brand.peopleTweets,
                  "utf-8"
                );
                existingPeopleTweets = JSON.parse(existingPeopleTweets);
                let existingBrandTweetsToCheckRetweet = fs.readFileSync(
                  brand.brandFile,
                  "utf-8"
                );
                existingBrandTweetsToCheckRetweet = JSON.parse(
                  existingBrandTweetsToCheckRetweet
                );
                //check retweet in people tweets
                const originalTweetInPeopleTweets = returnOriginalTweet(
                  tweet,
                  existingPeopleTweets
                );
                if (originalTweetInPeopleTweets) {
                  existingPeopleTweets = existingPeopleTweets.map(
                    (existingTweet) =>
                      existingTweet.tweetId ===
                      originalTweetInPeopleTweets.tweetId
                        ? {
                            ...existingTweet,
                            retweetCount: existingTweet.retweetCount + 1,
                          }
                        : existingTweet
                  );
                }
                //check retweet in brand tweets
                const originalTweetInBrandTweets = returnOriginalTweet(
                  tweet,
                  existingBrandTweetsToCheckRetweet
                );
                if (originalTweetInBrandTweets) {
                  existingBrandTweetsToCheckRetweet =
                    existingBrandTweetsToCheckRetweet.map((existingTweet) => {
                      if (
                        existingTweet.tweetId ===
                        originalTweetInBrandTweets.tweetId
                      )
                        existingTweet.retweetCount + 1;
                    });
                }
                //check unique
                if (
                  !originalTweetInPeopleTweets &&
                  !originalTweetInBrandTweets &&
                  !tweetIsInArray(tweet, existingPeopleTweets) &&
                  !tweet.retweetedId
                ) {
                  totalWrittenTweetCount++;
                  existingPeopleTweets.push({
                    ...tweet,
                    retweetCount: 0,
                    label: tweet.sentiment
                      ? tweet.sentiment === -1
                        ? 2
                        : tweet.sentiment
                      : null,
                  });
                }
                const tweetsPeopleJson = JSON.stringify(existingPeopleTweets);
                fs.writeFileSync(brand.peopleTweets, tweetsPeopleJson, "utf-8");
                //write to brand tweets if retweetCount++ there
                const tweetsBrandJsonWithRetweet = JSON.stringify(
                  existingBrandTweetsToCheckRetweet
                );
                fs.writeFileSync(
                  brand.brandFile,
                  tweetsBrandJsonWithRetweet,
                  "utf-8"
                );
                break;
              default:
                break;
            }
          });
        }
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
