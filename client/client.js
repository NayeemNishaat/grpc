const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const packageDefinition = protoLoader.loadSync("../protos/greet.proto");
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const greeterService = protoDescriptor.greet.GreetService;
// const sumService = grpc.loadPackageDefinition(
//   protoLoader.loadSync("../protos/sum.proto", {})
// ).sum.SumService;

const greetClient = new greeterService(
  "localhost:50051",
  grpc.credentials.createInsecure()
);

// const sumClient = new sumService(
//   "localhost:50051",
//   grpc.credentials.createInsecure()
// );

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

const call = greetClient.greetManyTimes(
  { greeting: { firstName: "Nayeem", lastName: "Nishaat" } },
  () => {}
);

call.on("data", (res) => {
  console.log("Server Stream", res.result);
});

call.on("status", (status) => {
  console.log("Server Stream Status", status);
});

call.on("error", (error) => {
  console.error(error);
});

call.on("end", () => {
  console.log("Stream Ended!");
});

/* sumClient.Sum({ num1: 10, num2: 5 }, (error, response) => {
  if (!error) {
    console.log(response.total);
  } else {
    console.error(error);
  }
}); */
