const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const packageDefinition = protoLoader.loadSync("../protos/greet.proto", {});
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const greetService = protoDescriptor.greet.GreetService;
const sumService = grpc.loadPackageDefinition(
  protoLoader.loadSync("../protos/sum.proto", {})
).sum.SumService;
const factorService = grpc.loadPackageDefinition(
  protoLoader.loadSync("../protos/factor.proto", {})
).factor.FactorService;

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
function sum(call, callback) {
  callback(null, { total: call.request.num1 + call.request.num2 });
}

/**
 * Factor Server Streaming RPC Method
 */
function factor(call, callback) {
  let { number } = call.request,
    k = 2;

  if (number <= 1) {
    call.write({
      factorFailResponse: { error: true, message: "Invalid Input" }
    });
    call.end();
    return;
  }

  while (number > 1) {
    if (number % k === 0) {
      call.write({ factorSuccessResponse: { number: k } });
      number = Math.trunc(number / k);
    } else {
      k++;
    }
  }
  call.end();
}

const server = new grpc.Server();
// server.addService(greetService.service, { Greet: greet, greetManyTimes });
// server.addService(sumService.service, { Sum: sum });
server.addService(factorService.service, { factor });

server.bindAsync(
  "0.0.0.0:50051",
  grpc.ServerCredentials.createInsecure(),
  () => {
    console.log("Server running at http://127.0.0.1:50051");
  }
);
