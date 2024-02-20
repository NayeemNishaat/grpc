const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
// const packageDefinition = protoLoader.loadSync("../protos/greet.proto");
// const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
// const greeterService = protoDescriptor.greet.GreetService;
// const sumService = grpc.loadPackageDefinition(
//   protoLoader.loadSync("../protos/sum.proto", {})
// ).sum.SumService;
const factorService = grpc.loadPackageDefinition(
  protoLoader.loadSync("../protos/factor.proto", {})
).factor.FactorService;

// const greetClient = new greeterService(
//   "localhost:50051",
//   grpc.credentials.createInsecure()
// );

// const sumClient = new sumService(
//   "localhost:50051",
//   grpc.credentials.createInsecure()
// );

const factorClient = new factorService(
  "localhost:50051",
  grpc.credentials.createInsecure()
);

/* greetClient.Greet(
  { greeting: { firstName: "Nayeem", lastName: "Nishaat" } },
  (error, response) => {
    if (!error) {
      console.log("Greetings " + response.result);
    } else {
      console.error(error);
    }
  }
); */

/* const greetCall = greetClient.greetManyTimes(
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
}); */

/* sumClient.Sum({ num1: 10, num2: 5 }, (error, response) => {
  if (!error) {
    console.log(response.total);
  } else {
    console.error(error);
  }
}); */

const factorCall = factorClient.factor({ number: 100 }, () => {});

factorCall.on("data", (res) => {
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

factorCall.on("status", (status) => {
  console.log("Server Stream Status", status);
});

factorCall.on("error", (error) => {
  console.error(error);
});

factorCall.on("end", () => {
  console.log("Stream Ended!");
});
