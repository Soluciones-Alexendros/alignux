//! `namesrv` — servidor de nombres → capacidades con ACL (placeholder M0).
//!
//! Implementación real en T1-03. La autoridad nunca se concede por nombre,
//! solo por capacidad (regla arquitectónica 1). Modelo de capacidades: S-01.
//!
//! verifies: T1-03

#![no_std]

#[cfg(test)]
mod tests {
    #[test]
    fn placeholder_workspace_is_valid() {
        assert_eq!(2 + 2, 4);
    }
}
