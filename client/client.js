const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const packageDefinition = protoLoader.loadSync("../protos/greet.proto");
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const greeterService = protoDescriptor.greet.GreetService;

const client = new greeterService(
  "localhost:50051",
  grpc.credentials.createInsecure()
);

client.Greet(
  { greeting: { firstName: "Nayeem", lastName: "Nishaat" } },
  (error, response) => {
    if (!error) {
      console.log("Greetings " + response.result);
    } else {
      console.error(error);
    }
  }
);
