//! `resmgr` — gestor de recursos PCI/ACPI (placeholder M0).
//!
//! Implementación real en T1-04. Drivers «IOMMU-first»: todo DMA declara
//! `<io_address_space>` (ADR-06).
//!
//! verifies: T1-04

#![no_std]

#[cfg(test)]
mod tests {
    #[test]
    fn placeholder_workspace_is_valid() {
        assert_eq!(2 + 2, 4);
    }
}
