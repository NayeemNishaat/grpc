const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const packageDefinition = protoLoader.loadSync("../protos/greet.proto");
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const greeterService = protoDescriptor.greet.GreetService;
const sumService = grpc.loadPackageDefinition(
  protoLoader.loadSync("../protos/sum.proto", {})
).sum.SumService;

const greetClient = new greeterService(
  "localhost:50051",
  grpc.credentials.createInsecure()
);

// const sumClient = new sumService(
//   "localhost:50051",
//   grpc.credentials.createInsecure()
// );

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
      console.log("Sending Data");
      call.write({ greeting: { firstName: "Nayeem", lastName: "Nishaat" } });

      if (++count > 2) {
        clearInterval(intervalID);
        call.end();
      }
    }, 1000);
}

function sum() {
  sumClient.Sum({ num1: 10, num2: 5 }, (error, response) => {
    if (!error) {
      console.log(response.total);
    } else {
      console.error(error);
    }
  });
}

function factor() {
  const sumCall = sumClient.factor({ number: 567890 }, () => {});

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

// Execute RPCs
// factor();
longGreet();
