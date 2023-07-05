#############################
# █▀█ █▀▀ █░░ █▀▀ ▄▀█ █▀ █▀▀
# █▀▄ ██▄ █▄▄ ██▄ █▀█ ▄█ ██▄ 
#############################
HOLOCHAIN_REV :=$(shell jq .holochain_rev ./version-manager.json | tr -d '"')

version:
	@echo $(shell jq .version ./version-manager.json)

# requirements
# - cargo-edit crate: `cargo install cargo-edit`
# - jq linux terminal tool : `sudo apt-get install jq`
# How to make a release?
# - Update the version-manage.json with the version to bump
# - run `make update`: Updates the repo with the lib that are mentioned in version-manager.json
# - when this is merged into `main` a release will be auto-deploy

update:
	rm -f Cargo.lock
	echo '⚙️  Updating hdk and hdi crate...'
	cargo upgrade hdk@=$(shell jq .hdk ./version-manager.json) hdi@=$(shell jq .hdi ./version-manager.json) --workspace --pinned
	echo '⚙️  Updating holochain_version in nix...'
	nix flake lock --override-input holochain github:holochain/holochain/$(HOLOCHAIN_REV)
	echo '⚙️  Building dnas and happ...'
	rm -rf Cargo.lock
	make nix-build
	echo '⚙️  Running tests...'
	make nix-test-dna-debug

#
# Test and build test Project
#
# This Makefile is primarily instructional; you can simply enter the Nix environment for
# holochain development (supplied by holonix;) via `nix develop` and run
# `make test` directly, or build a target directly, eg. `nix-build -A test`.
#
SHELL		= bash
DNANAME		= test
DNA		= $(DNANAME).dna
HAPP = ${DNANAME}.happ
WASM		= target/wasm32-unknown-unknown/release/test.wasm

# External targets; Uses a `nix develop` environment to obtain Holochain runtimes, run tests, etc.
.PHONY: all FORCE
all: nix-test

# nix-test, nix-install, ...
nix-%:
	nix develop --command bash -c "make $*"
	
.PHONY: test test-dna test-dna-debug
test: test-dna

test-dna:	build FORCE
	@echo "Starting Scenario tests in $$(pwd)..."; \
		cd tests && ( [ -d  node_modules ] || npm install ) && npm test

test-dna-debug: build FORCE
	@echo "Starting Scenario tests in $$(pwd)..."; \
	    cd tests && ( [ -d  node_modules ] || npm install ) && npm run test-debug

# Internal targets; require a Nix environment in order to be deterministic.
# - Uses the version of `dna-util`, `holochain` on the system PATH.
# - Normally called from within a Nix environment, eg. run `nix develop`
.PHONY:		rebuild install build
rebuild:	clean build

install:	build

build: $(HAPP) alternate-happ-configs


$(HAPP): $(DNA) FORCE
	@hc app pack . -o ./$(DNANAME).happ
	@ls -l $@

# Package the DNA from the built target release WASM
$(DNA):		$(WASM) FORCE
	@echo "Packaging DNA:"
	@hc dna pack . -o ./$(DNANAME).dna

# Recompile the target release WASM
$(WASM): FORCE
	@echo "Building  DNA WASM:"
	@RUST_BACKTRACE=1 CARGO_TARGET_DIR=target cargo build \
	    --release --target wasm32-unknown-unknown

alternate-happ-configs: $(DNA) FORCE
	@for NAME in $(shell ls alternate-happ-configs); do \
		hc app pack "alternate-happ-configs/$$NAME" -o "$(DNANAME)-$$NAME.happ"; \
	done

# Generic targets; does not require a Nix environment
.PHONY: clean
clean:
	rm -rf \
	    .cargo \
	    target \
	    $(DNA) \
	    $(HAPP)
	for NAME in $(shell ls alternate-happ-configs); do \
		rm -f "alternate-happ-configs/$$NAME/$(DNANAME)-$$NAME.happ"; \
	done
	