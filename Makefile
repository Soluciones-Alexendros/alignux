# ALIGNUX — orquestación de build (scaffold M0).
# make image / make run / make test / make lint

.PHONY: sdk image run test lint clean

sdk:
	./tools/sdk-fetch.sh --verify-sha256

image: sdk
	@echo "ALIGNUX: construyendo imagen (M0)"
	@echo "  La generación real de la imagen requiere el SDK (T0-04)."
	@echo "  make image falla de forma controlada hasta que T0-02/T0-04 estén completos."

run: image
	./tools/qemu-boot-test.sh

test:
	cargo test --workspace

lint:
	cargo fmt --all --check
	cargo clippy --workspace -- -D warnings
	./tools/sdf-check system.sdf
	./tools/idl-check idl

clean:
	cargo clean
	rm -rf sdk
