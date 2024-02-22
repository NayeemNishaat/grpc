#! /bin/bash 

npx grpc_tools_node_protoc \
  --js_out=import_style=commonjs,binary:./server \
  --grpc_out=./server \
  ./protos/*.proto