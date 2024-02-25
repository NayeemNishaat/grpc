const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const fs = require("node:fs");
const packageDefinition = protoLoader.loadSync("../protos/greet.proto");
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const greeterService = protoDescriptor.greet.GreetService;
const computeService = grpc.loadPackageDefinition(
  protoLoader.loadSync("../protos/compute.proto", {})
).sum.ComputeService;
const blogService = grpc.loadPackageDefinition(
  protoLoader.loadSync("../protos/blog.proto")
).blog.BlogService;

/**
 * SSL
 */
const secureCreds = grpc.credentials.createSsl(
  fs.readFileSync("../certs/ca.crt"),
  fs.readFileSync("../certs/client.pem"),
  fs.readFileSync("../certs/client.crt")
);
const insecureCreds = grpc.ServerCredentials.createInsecure();

// const greetClient = new greeterService("localhost:50051", insecureCreds);
// const computeClient = new computeService("localhost:50051", secureCreds);
const blogClient = new blogService("localhost:50051", secureCreds);

function greet() {
  greetClient.Greet(
    { greeting: { firstName: "Nayeem", lastName: "Nishaat" } },
    (error, response) => {
      if (!error) {
        console.log("Greetings " + response.result);
      } else {
        console.error(error);
      }
    }
  );
}

function greetManyTimes() {
  const greetCall = greetClient.greetManyTimes(
    { greeting: { firstName: "Nayeem", lastName: "Nishaat" } },
    () => {}
  );

  greetCall.on("data", (res) => {
    console.log("Server Stream", res.result);
  });

  greetCall.on("status", (status) => {
    console.log("Server Stream Status", status);
  });

  greetCall.on("error", (error) => {
    console.error(error);
  });

  greetCall.on("end", () => {
    console.log("Stream Ended!");
  });
}

function longGreet() {
  const call = greetClient.longGreet({}, (err, res) => {
    if (!err) {
      console.log(res.result);
    } else {
      console.error(err);
    }
  });

  let count = 0,
    intervalID = setInterval(() => {
      console.log("Sending Data", count);
      call.write({ greeting: { firstName: "Nayeem", lastName: "Nishaat" } });

      if (++count > 2) {
        clearInterval(intervalID);
        call.end();
      }
    }, 1000);
}

/**
 * Sleep for the specified amount of time
 */
async function sleep(interval) {
  return new Promise((resolve, _reject) => {
    setTimeout(() => {
      resolve();
    }, interval);
  });
}

async function greetEveryone() {
  const call = greetClient.greetEveryone({}, (err, res) => {
    console.log(err);
    console.log(res);
  });

  call.on("data", (res) => {
    console.log(res.result);
  });

  call.on("error", (err) => {
    console.error(err);
  });

  call.on("status", (status) => {
    console.log(status);
  });

  call.on("end", () => {
    console.log("Server Ended!");
  });

  for (let i = 0; i < 10; i++) {
    call.write({ greeting: { firstName: "Yeakub", lastName: "Ali" } });
    await sleep(1500);
  }

  call.end();
}

function sum() {
  computeClient.Sum({ num1: 10, num2: 5 }, (error, response) => {
    if (!error) {
      console.log(response.total);
    } else {
      console.error(error);
    }
  });
}

function factor() {
  const sumCall = computeClient.factor({ number: 0 }, () => {});

  sumCall.on("data", (res) => {
    switch (Object.keys(res)[0]) {
      case "factorFailResponse":
        console.log(
          "Server Stream Error Response:",
          res.factorFailResponse.message
        );
        break;

      case "factorSuccessResponse":
        console.log(
          "Server Stream Success Response:",
          res.factorSuccessResponse.number
        );
        break;

      default:
        break;
    }
  });

  sumCall.on("status", (status) => {
    console.log("Server Stream Status", status);
  });

  sumCall.on("error", (error) => {
    console.error(error);
  });

  sumCall.on("end", () => {
    console.log("Stream Ended!");
  });
}

function avg() {
  const call = computeClient.avg({}, (err, res) => {
    if (!err) {
      console.log("Average:", res.avg);
    } else {
      console.error(err);
    }
  });

  let count = 0,
    intervalID = setInterval(() => {
      const num = Math.trunc(Math.random() * 10);
      console.log("Sent:", num);
      call.write({ num });

      if (++count > 2) {
        clearInterval(intervalID);
        call.end();
      }
    }, 1000);
}

async function currentMax() {
  const call = computeClient.currentMax({}, (_err, _res) => {});

  call.on("data", (res) => {
    console.log("Current Max: ", res.num);
  });

  call.on("error", (err) => {
    console.error(err);
  });

  call.on("end", () => {
    console.log("Server Ended!");
  });

  const nums = [1, 5, 3, 6, 2, 20];
  for (const num of nums) {
    call.write({ num });
    await sleep(1000);
  }

  call.end();
}

function sqrt() {
  computeClient.sqrt(
    { num: 100 },
    { deadline: Date.now() + 100 }, // Note: Setting GRPC deadline. Remark: Deadline gets propagated
    (err, res) => {
      if (!err) {
        console.log("Square Root Is: ", res.num);
      } else {
        console.error(err);
      }
    }
  );
}

function listBlog() {
  const listBlogCall = blogClient.listBlog({ id: 10 });

  listBlogCall.on("data", (res) => {
    res.blog.id = Number(res.blog.id);
    console.log(res.blog);
  });

  listBlogCall.on("error", (err) => {
    if (err.code === grpc.status.NOT_FOUND) {
      console.log("No blog found.");
    } else console.error(err);
  });

  listBlogCall.on("end", () => {
    console.log("Done with blogs!");
  });
}

function createBlog() {
  blogClient.createBlog(
    { blog: { author: "lby", title: "Test", content: "This is content!" } },
    (err, res) => {
      if (!err) {
        console.log(res);
      } else {
        console.error(err);
      }
    }
  );
}

function updateBlog() {
  blogClient.updateBlog(
    {
      set: { author: "Nayeem", title: "Magnificent", content: "Shab e-Barat." },
      where: { id: 10, author: "lby" }
    },
    (err, res) => {
      if (!err) {
        console.log(res.message);
      } else {
        console.error(err);
      }
    }
  );
}

function deleteBlog() {
  blogClient.deleteBlog({ id: 8 }, (err, res) => {
    if (!err) {
      console.log(res.message);
    } else if (err.code === grpc.status.NOT_FOUND) {
      console.log(err.details);
    } else {
      console.error(err);
    }
  });
}

// Execute RPCs
// factor();
// sum();
// longGreet();
// avg();
// greetEveryone();
// currentMax();
// sqrt();
// listBlog();
// createBlog();
// updateBlog();
deleteBlog();
