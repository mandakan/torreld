# TORRELD deploy helpers. The app is one self-contained HTML file; "building"
# is just copying it to dist/index.html so Cloudflare serves it at the root.
SRC  = torreld-template.html
DIST = dist/index.html

.PHONY: build deploy clean

build: $(DIST)

$(DIST): $(SRC)
	mkdir -p dist
	cp $(SRC) $(DIST)

# Sync the artifact, then publish the Worker (binds torreld.urdr.dev).
deploy: build
	wrangler deploy

clean:
	rm -rf dist
