import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Buffer } from "node:buffer";

// Aislar las peticiones de Axios/Vite para probar las respuestas de ambos servicios.
const source = (await readFile(new URL("../src/services/dashboardService.js", import.meta.url), "utf8"))
  .replace(/^import .*;\r?\n/gm, "");
const { loadDashboardData } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
const products = [{ id: 1, name: "Producto", stock: 4 }];
const okProducts = async () => ({ data: products });

test("mantiene inventario cuando ventas devuelve 404", async () => {
  const data = await loadDashboardData(okProducts, async () => { throw { response: { status: 404 } }; });
  assert.deepEqual(data.products, products);
  assert.match(data.salesError, /aún no está disponible/);
});

test("muestra ventas reales y distingue ventas vacías de ventas no disponibles", async () => {
  for (const sales of [[], [{ total: 100 }]]) {
    const data = await loadDashboardData(okProducts, async () => ({ data: sales }));
    assert.deepEqual(data.sales, sales);
    assert.equal(data.salesError, "");
  }
});

test("un fallo de red en ventas permite consultar inventario", async () => {
  const data = await loadDashboardData(okProducts, async () => { throw new Error("Network Error"); });
  assert.deepEqual(data.products, products);
  assert.match(data.salesError, /No se pudieron cargar/);
});

test("un fallo de inventario se comunica como error", async () => {
  const error = new Error("Inventario inaccesible");
  await assert.rejects(loadDashboardData(async () => { throw error; }, async () => ({ data: [] })), error);
});
