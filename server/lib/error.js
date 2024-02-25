const grpc = require("@grpc/grpc-js");

exports.catchAsync = (fn) => (call, callback) =>
  Promise.resolve(fn(call, callback)).catch((err) => {
    console.error(err);

    call.emit("error", {
      code: grpc.status.INTERNAL,
      message: "Something went wrong!"
    });
  });
