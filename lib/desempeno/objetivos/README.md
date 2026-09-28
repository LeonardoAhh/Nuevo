# Objetivos por puesto

Cada archivo de esta carpeta reúne las plantillas de objetivos de un área. Para actualizar un puesto, localiza su nombre en `../objetivos-catalogo.ts`, sigue la plantilla que tiene asignada y edita esa lista aquí. Los puestos A/B/C/D suelen compartir una plantilla; si necesitan objetivos distintos, crea una lista nueva y cambia sólo la asociación de ese puesto.

Las plantillas contienen valores iniciales. Las evaluaciones guardadas conservan sus propios objetivos y no se actualizan al cambiar estas listas.

`OBJETIVOS_AUXILIAR_DE_SUPERVISOR` está definida en `produccion.ts`, pero ningún puesto la usa todavía. Los puestos `AUXILIAR DE SUPERVISOR A/B` usan `_OBJETIVOS_AUXILIAR_SUPERVISOR`.

## Puestos pendientes de plantilla

Estos puestos aparecen en el catálogo organizacional pero no tienen asociación en `../objetivos-catalogo.ts`. Actualmente reciben el objetivo genérico definido en `../../types/desempeno.ts`:

- `JEFE DE CALIDAD`
- `INGENIERO DE CALIDAD PROCESOS A`
- `INGENIERO DE CALIDAD PROCESOS B`
- `JEFE DE METROLOGÍA`
- `SUPERVISOR DE METROLOGÍA`
