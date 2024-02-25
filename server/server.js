const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const fs = require("node:fs");
const { query } = require("./db");
const { catchAsync } = require("./lib/error");
const packageDefinition = protoLoader.loadSync("../protos/greet.proto", {});
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const greetService = protoDescriptor.greet.GreetService;
const computeService = grpc.loadPackageDefinition(
  protoLoader.loadSync("../protos/compute.proto", {})
).sum.ComputeService;
const blogService = grpc.loadPackageDefinition(
  protoLoader.loadSync("../protos/blog.proto")
).blog.BlogService;

/**
 * SSL
 */
const secureCreds = grpc.ServerCredentials.createSsl(
  fs.readFileSync("../certs/ca.crt"),
  [
    {
      cert_chain: fs.readFileSync("../certs/server.crt"),
      private_key: fs.readFileSync("../certs/server.pem")
    }
  ],
  true
);
const insecureCreds = grpc.ServerCredentials.createInsecure();

/**
 * Implemen Greet RPC method
 */
function greet(call, callback) {
  callback(null, { result: call.request.greeting.firstName });
}

/**
 * Implemen GreetManyTimes RPC Server Streaming Method
 */
function greetManyTimes(call) {
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
    callback(null, { result: "Server response on client end request!" });
  });
}

/**
 * Sleep for the specified amount of time
 */
async function sleep(interval) {
  return new Promise((resolve, _reject) => {
    setTimeout(() => {
      resolve();
    }, interval);
  });
}

/**
 * greetEveryone BiDi Streaming API
 */
async function greetEveryone(call) {
  call.on("data", (req) => {
    console.log(req.greeting.firstName + " " + req.greeting.lastName);
  });

  call.on("error", (err) => {
    console.error(err);
  });

  // Remark: Don't have status event in the server

  call.on("end", () => {
    console.log("Client Ended!");
  });

  for (let i = 0; i < 10; i++) {
    call.write({ result: "Nayeem Nishaat" });
    await sleep(1000);
  }

  call.end();
}

/**
 * Sum RPC method
 */
function sum(call, callback) {
  callback(null, { total: call.request.num1 + call.request.num2 });
}

/**
 * Factor Server Streaming RPC Method
 * Important: callback is unavailable for server streaming
 */
function factor(call) {
  let { number } = call.request,
    divisor = 2;

  if (number <= 1) {
    // call.write({
    //   factorFailResponse: { error: true, message: "Invalid Input" }
    // });
    // call.end();
    // return

    // Alt: Preferred way of error handling
    call.emit("error", {
      code: grpc.status.INVALID_ARGUMENT,
      message: "Invalid Input"
      // details: "Invalid Input"
    });
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

/**
 * Avg Client Streaming RPC Method
 */
function avg(call, callback) {
  let avg = 0,
    n = 1;

  call.on("data", (req) => {
    console.log("Received:", req.num);
    avg = (avg * (n - 1) + req.num) / n;
    n++;
  });

  call.on("error", (err) => {
    console.error(err);
  });

  call.on("end", () => {
    callback(null, { avg: Math.round(avg * 1e2) / 1e2 });
  });
}

/**
 * CurrentMax BiDi Streaming RPC Method
 * Important: callback is unavailable for bidi streaming
 */
function currentMax(call) {
  let currentMax = -Number.MAX_SAFE_INTEGER;

  call.on("data", (req) => {
    if (req.num > currentMax) {
      currentMax = req.num;
      call.write({ num: currentMax });
    }
  });

  call.on("error", (err) => {
    console.error(err);
  });

  call.on("end", () => {
    console.log("Client Ended!");
    call.end();
  });
}

/**
 * Error handling
 */
function sqrt(call, callback) {
  const { num } = call.request;

  if (num >= 0) {
    callback(null, { num: Math.sqrt(num) });
  } else {
    // Part: Do Error handling
    callback({
      code: grpc.status.INVALID_ARGUMENT,
      message: "Number is not positive!"
    });
  }
}

/**
 * Blog CRUD
 */
async function listBlog(call) {
  try {
    const { id } = call.request;
    let blogs;

    if (id) {
      blogs = await query(`SELECT * FROM blogs WHERE id = $1`, [Number(id)]);
    } else {
      blogs = await query(`SELECT * FROM blogs`);
    }

    if (!blogs.rowCount) {
      return call.emit("error", {
        code: grpc.status.NOT_FOUND,
        message: "No blog for this ID."
      });
    }

    blogs.rows.forEach((b) => {
      call.write({ blog: b });
    });
    call.end();
  } catch (err) {
    console.error(err);
    call.emit("error", {
      code: grpc.status.INTERNAL,
      message: "Something went wrong!"
    });
  }
}

async function createBlog(call, callback) {
  try {
    const { author, title, content } = call.request.blog;
    const insertedBlog = await query(
      `INSERT INTO blogs VALUES(DEFAULT, $1, $2, $3) RETURNING *`,
      [author, title, content]
    );

    callback(null, { blog: insertedBlog.rows[0] });
  } catch (err) {
    console.error(err);
    callback({ code: grpc.status.INTERNAL, message: "Something went wrong!" });

    // Alt: Can also emit error
    // call.emit("error", {
    //   code: grpc.status.INTERNAL,
    //   message: "Something went wrong!"
    // });
  }
}

const updateBlog = catchAsync(async function (call, callback) {
  const { set, where } = call.request;

  let setQuery = "",
    whereQuery = "",
    i = 0;
  const params = [];

  Object.entries(set).forEach(([k, v], j) => {
    if (j !== 0) setQuery += ", ";
    setQuery += `${k} = $${++i}`;
    params.push(k === "id" ? Number(v) : v);
  });

  Object.entries(where).forEach(([k, v], j) => {
    if (j !== 0) whereQuery += " AND ";
    whereQuery += `${k} = $${++i}`;
    params.push(k === "id" ? Number(v) : v);
  });

  const updateRes = await query(
    `UPDATE blogs SET ${setQuery} WHERE ${whereQuery};`,
    params
  );

  if (updateRes.rowCount) {
    callback(null, { message: "Updated" });
  } else {
    callback({ code: grpc.status.NOT_FOUND, message: "No match found!" });
  }
});

const deleteBlog = catchAsync(async (call, callback) => {
  const { id } = call.request;

  const delRes = await query(`DELETE FROM blogs WHERE id = $1;`, [Number(id)]);

  if (delRes.rowCount) {
    callback(null, { message: "Deleted!" });
  } else {
    callback({ code: grpc.status.NOT_FOUND, message: "No match found!" });
  }
});

const server = new grpc.Server();
server.addService(blogService.service, {
  listBlog,
  createBlog,
  updateBlog,
  deleteBlog
});
// server.addService(greetService.service, {
//   Greet: greet,
//   greetManyTimes,
//   longGreet,
//   greetEveryone
// });
// server.addService(computeService.service, {
//   Sum: sum,
//   factor,
//   avg,
//   currentMax,
//   sqrt
// });

server.bindAsync("0.0.0.0:50051", secureCreds, () => {
  console.log("Server running at http://127.0.0.1:50051");
});
