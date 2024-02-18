const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const packageDefinition = protoLoader.loadSync("../protos/greet.proto", {});
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const greetService = protoDescriptor.greet.GreetService;

/**
 * Implemen Greet RPC method
 */
function greet(call, callback) {
  callback(null, { result: call.request.greeting.firstName });
}

const server = new grpc.Server();
server.addService(greetService.service, { Greet: greet });

server.bindAsync(
  "0.0.0.0:50051",
  grpc.ServerCredentials.createInsecure(),
  () => {
    console.log("Server running at http://127.0.0.1:50051");
  }
);
