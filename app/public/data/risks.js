export const RISKS = [
  ["R-02", "high", "Ecosistema de drivers inmaduro", "sDDF es joven; NVMe, red y GPU habrá que escribirlos o portarlos."],
  ["R-05", "high", "Gestor dinámico prematuro", "Introducir dinamismo antes de estabilizar la recuperación multiplica el coste de depuración."],
  ["R-09", "high", "Inflación de alcance hacia escritorio/POSIX", "El atractivo de «que arranque un escritorio» puede descarrilar el núcleo del proyecto."],
  ["R-01", "low", "Brecha de verificación en x86-64 + MCS", "La configuración de ejecución no tiene cobertura formal; el argumento «verificado» se devalúa si se comunica mal."],
  ["R-04", "low", "Curva de aprendizaje del modelo de capacidades", "CSpace, Untyped, revoke y MCS son conceptos exigentes para el equipo."],
  ["R-03", "low", "Cambios incompatibles de Microkit 2.3.x en x86-64", "IOMMU por defecto, polaridad IOAPIC corregida y nuevas restricciones de VMs rompen supuestos antiguos."],
  ["R-06", "low", "El AERO X16 es un primer hardware ambicioso", "Firmware propietario, IOMMU estricta, gestión de energía y sin puerto serie fácil."],
  ["R-07", "low", "SMP en configuración MCS", "Las combinaciones SMP+MCS+HYP tienen historial de bugs (ajustes recientes en 16.0.0)."],
  ["R-08", "low", "Dependencia de una comunidad pequeña", "Soporte por listas y GitHub sin acuerdo de nivel de servicio."],
  ["R-10", "low", "Sobre-ingeniería de la IDL", "Diseñar el lenguaje de interfaces más allá de lo que los servicios reales piden."],
  ["R-11", "low", "Mala comunicación del aseguramiento", "Sobredimensionar lo verificado dañaría la credibilidad del proyecto."],
];
