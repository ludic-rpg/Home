.PHONY: dev

dev:
	@echo "Starting Astro dev server..."
	@open http://localhost:4321 &
	docker compose up
