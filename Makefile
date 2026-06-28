.PHONY: app app-stop

APP_HOST ?= 127.0.0.1
APP_PORT ?= 5175
APP_DIR ?= apps/www

app:
	pnpm --dir $(APP_DIR) dev --host $(APP_HOST) --port $(APP_PORT)

app-stop:
	@pids="$$(lsof -tiTCP:$(APP_PORT) -sTCP:LISTEN 2>/dev/null)"; \
	if [ -n "$$pids" ]; then \
		kill $$pids; \
	else \
		echo "No process listening on $(APP_HOST):$(APP_PORT)"; \
	fi
