# TORRELD deploy helpers. The deployed artifact is one self-contained HTML
# file; `make build` inlines src/ into dist/index.html via build.py.
DIST    = dist/index.html
BUILD   = build.py
SRC     = $(wildcard src/framework/*) $(wildcard src/packs/*.js)

.PHONY: build deploy clean

build: $(DIST)

$(DIST): $(BUILD) $(SRC)
	python3 $(BUILD)

# Sync the artifact, then publish the Worker (binds torreld.urdr.dev).
deploy: build
	wrangler deploy

clean:
	rm -rf dist
