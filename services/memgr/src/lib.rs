//! `memgr` — gestor de memoria por capacidades (placeholder M0).
//!
//! Implementación real en T1-02. Contrato de memoria: S-05. Modelo de
//! capacidades: S-01. Este crate existe para que el workspace compile y el CI
//! L1/L2 tenga una base verde hasta que exista código real.
//!
//! verifies: T1-02, T1-08

#![no_std]

#[cfg(test)]
mod tests {
    #[test]
    fn placeholder_workspace_is_valid() {
        assert_eq!(2 + 2, 4);
    }
}
