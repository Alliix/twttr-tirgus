const fs = require("fs");

getLabeledData = () => {
  const dirs = ["./peopleTweets", "./brandTweets"];
  // let labeledTweets = [];
  dirs.forEach((dir) => {
    fs.readdir(dir, (err, files) => {
      if (err) {
        throw err;
      }
      files.forEach((file) => {
        try {
          let labeledTweets = fs.readFileSync(
            "./labeledTweets/allLabeledTweets.json",
            "utf-8"
          );
          labeledTweets = JSON.parse(labeledTweets);

          let tweets = fs.readFileSync(`${dir}/${file}`, "utf-8");
          tweets = JSON.parse(tweets);
          labeledTweets = [
            ...labeledTweets,
            ...tweets.filter((tweet) => tweet.label != null),
          ];

          fs.writeFileSync(
            "./labeledTweets/allLabeledTweets.json",
            JSON.stringify(labeledTweets),
            "utf-8"
          );
        } catch (err) {
          console.log(err, file);
        }
      });
    });
  });
};

getAllData = () => {
  const dirs = ["./peopleTweets", "./brandTweets"];
  dirs.forEach((dir) => {
    fs.readdir(dir, (err, files) => {
      if (err) {
        throw err;
      }
      files.forEach((file) => {
        try {
          let allTweets = fs.readFileSync(
            "./allTweets/allTweets.json",
            "utf-8"
          );
          allTweets = JSON.parse(allTweets);

          let tweets = fs.readFileSync(`${dir}/${file}`, "utf-8");
          tweets = JSON.parse(tweets);
          allTweets = [...allTweets, ...tweets];

          fs.writeFileSync(
            "./allTweets/allTweets.json",
            JSON.stringify(allTweets),
            "utf-8"
          );
        } catch (err) {
          console.log(err, file);
        }
      });
    });
  });
};
