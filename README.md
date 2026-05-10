# Justo Venn Weekly Report

Automatización semanal para:

- recalcular los cruces de `eCommerce`, `Justo Delivery` y `Punto de Venta`
- generar 4 imágenes Venn (`Chile`, `Peru`, `Colombia`, `Mexico`)
- actualizar la slide 26 actual de la presentación
- guardar el histórico semanal en la pestaña `Historial`

## Fuente de datos

Este proyecto usa siempre la CLI oficial:

`npx @getjusto/team-cli`

Queries:

- `69b9f8aa1cc3b0a9a1238125` websites base
- `69b9fbb9b30e67e7c8567bc5` BI snapshots
- `69ba26a246c06d093d3533e6` order channels

## Variables requeridas

### Justo

- `JUSTO_TEAM_CLI_EMAIL`
- `JUSTO_TEAM_CLI_TOKEN`
- `JUSTO_TEAM_CLI_REFRESH_TOKEN`

Estas tres permiten que `team-cli` corra en CI sin login interactivo.

### Google

- `GOOGLE_SERVICE_ACCOUNT_JSON`

Debe ser el JSON completo de una service account con acceso de edición a:

- presentación: `1c8daPDVUmymMNjq-5tshBlrieRTfVe4AXKFQ1qYKHhI`
- spreadsheet: `1syz8grlwGTjVfmV_Zb6JkgR2w8ZP6vHWx6gTkZI_gXc`

Comparte ambos documentos con el email de la service account como editor.

## Ejecución local

```bash
npm install
npm run run
```

## Programación semanal

El workflow corre todos los lunes en dos horarios UTC:

- `13:00 UTC`
- `14:00 UTC`

El script valida internamente si en `America/Santiago` son las `10:00` del lunes, para cubrir DST sin duplicar la corrida.

## Historial

La hoja `Historial` recibe 4 filas por corrida, una por país, con estas columnas:

- `run_date`
- `week_label`
- `country`
- `ecommerce_total`
- `delivery_total`
- `pos_total`
- `e_only`
- `d_only`
- `p_only`
- `ed_only`
- `ep_only`
- `dp_only`
- `all_three`
