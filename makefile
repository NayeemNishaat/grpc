start_db:
	/opt/homebrew/opt/postgresql@16/bin/postgres -D /opt/homebrew/var/postgresql@16

stop_db:
	@-pkill -SIGTERM -f "postgres"

seq?=mg
mg_create:
	/Users/labyrinth/.go/bin/migrate create -ext sql -dir ./migration -seq ${seq}

mg_up:
	/Users/labyrinth/.go/bin/migrate -path ./migration -database "postgres://localhost:5432/grpc?sslmode=disable" -verbose up ${v}

mg_down:
	/Users/labyrinth/.go/bin/migrate -path ./migration -database "postgres://localhost:5432/grpc?sslmode=disable" -verbose down ${v}

mg_fix:
	/Users/labyrinth/.go/bin/migrate -path ./migration -database "postgres://localhost:5432/grpc?sslmode=disable" force $(v)
# make migration_fix v=1
# v?=v_default # Assign default value if not provided