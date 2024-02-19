const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const packageDefinition = protoLoader.loadSync("../protos/greet.proto", {});
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const greetService = protoDescriptor.greet.GreetService;
const sumService = grpc.loadPackageDefinition(
  protoLoader.loadSync("../protos/sum.proto", {})
).sum.SumService;

/**
 * Implemen Greet RPC method
 */
function greet(call, callback) {
  callback(null, { result: call.request.greeting.firstName });
}

function greetManyTimes(call, callback) {
  const firstName = call.request.greeting.firstName;

  // setup streaming
  let count = 0,
    intervalID = setInterval(() => {
      call.write({ result: firstName });

      if (++count > 9) {
        clearInterval(intervalID);
        call.end();
      }
    }, 1000);
}

/**
 * Sum RPC method
 */
// function sum(call, callback) {
//   callback(null, { total: call.request.num1 + call.request.num2 });
// }

const server = new grpc.Server();
server.addService(greetService.service, { Greet: greet, greetManyTimes });
// server.addService(sumService.service, { Sum: sum });

server.bindAsync(
  "0.0.0.0:50051",
  grpc.ServerCredentials.createInsecure(),
  () => {
    console.log("Server running at http://127.0.0.1:50051");
  }
);
