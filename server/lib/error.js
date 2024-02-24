const grpc = require("@grpc/grpc-js");

exports.catchAsync = (fn) => (call) =>
  Promise.resolve(fn(call)).catch((err) => {
    console.error(err);

    call.emit("error", {
      code: grpc.status.INTERNAL,
      message: "Something went wrong!"
    });
  });
