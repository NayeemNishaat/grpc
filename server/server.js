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

/**
 * Implemen GreetManyTimes RPC Server Streaming Method
 */
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
 * Long Greet RPC Client Streaming Method
 */
function longGreet(call, callback) {
  call.on("data", (req) => {
    const fullName = req.greeting.firstName + " " + req.greeting.lastName;
    console.log(fullName);
  });

  call.on("error", (err) => {
    console.error(err);
  });

  call.on("end", () => {
    callback(null, { result: "End result!" });
  });
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
    divisor = 2;

  if (number <= 1) {
    call.write({
      factorFailResponse: { error: true, message: "Invalid Input" }
    });
    call.end();
    return;
  }

  while (number > 1) {
    if (number % divisor === 0) {
      call.write({ factorSuccessResponse: { number: divisor } });
      number = number / divisor;
    } else {
      divisor++;
    }
  }
  call.end();
}

const server = new grpc.Server();
server.addService(greetService.service, {
  Greet: greet,
  greetManyTimes,
  longGreet
});
// server.addService(sumService.service, { Sum: sum, factor });

server.bindAsync(
  "0.0.0.0:50051",
  grpc.ServerCredentials.createInsecure(),
  () => {
    console.log("Server running at http://127.0.0.1:50051");
  }
);
