# Importación de incumplimientos y actas administrativas

## Formato compartido

Ambas importaciones aceptan un arreglo JSON con `numero_empleado`, `mes` en formato `YYYY-MM` y las cantidades por día en propiedades numéricas (`"1"` a `"31"`). Un archivo puede incluir varios meses y el mismo empleado en meses distintos, pero no repetir al empleado dentro del mismo mes. Los conteos pueden ser enteros o cadenas de dígitos; no se aceptan negativos ni fracciones. Los ceros no se guardan y los días fuera del mes solo se aceptan con valor cero.

```json
[
  {
    "1": "0",
    "23": "2",
    "numero_empleado": "2160",
    "mes": "2026-06"
  },
  {
    "1": "1",
    "numero_empleado": "2160",
    "mes": "2026-07"
  }
]
```

Para actas administrativas, cada cantidad positiva crea esa cantidad de actas con la misma fecha. Los registros importados se crean con estatus `ACTIVO`, sin descripción ni fecha de revisión.

## Importación de incumplimientos

La ruta `/plantilla/incumplimientos/[numeroEmpleado]` muestra solo días con conteo mayor que cero del empleado seleccionado.

La importación se inicia desde el botón **Cargar incumplimientos** en la barra superior de la tabla de empleados de `/plantilla`. La ficha individual es de consulta.

El rol `dev` también puede capturar un incumplimiento desde la ficha individual. Solo se permite un registro por empleado y fecha. Si ya hay uno, la ficha muestra la cantidad existente y solicita confirmar antes de actualizar la cantidad total; si el registro cambió mientras se confirmaba, el guardado se rechaza para volver a validar los datos. Esta captura usa `public.registrar_incumplimiento_reglamento`.

## Reemplazo mensual

Cada acción reemplaza, en una única transacción, todos los registros de cada mes presente en el archivo para todos los empleados. Los meses no incluidos permanecen intactos. Empleados omitidos quedan fuera de los meses reemplazados. Un mes sin valores positivos vacía los datos existentes de ese mes. Si falla la validación o escritura de cualquier mes, no se aplica ninguno.

La tabla `public.incumplimientos_reglamento` guarda una fila por empleado, mes y día con incumplimientos. RLS limita lectura a empleados permitidos por `can_evaluate_employee`; solo el rol `dev` puede importar o borrar. La operación atómica vive en `public.reemplazar_meses_incumplimientos_reglamento`.

La tabla `public.actas_seguimiento` conserva actas administrativas; los planes de seguimiento se eliminan. La importación se expone junto a la de incumplimientos en `/plantilla` y está limitada al rol `dev`. `public.reemplazar_meses_actas_administrativas` reemplaza las actas de todos los meses incluidos en una sola transacción.

La migración `202611091300_multi_month_employee_day_imports.sql` agrega las RPC para carga de varios meses. Debe aplicarse en Supabase antes de usar este formato actualizado.
