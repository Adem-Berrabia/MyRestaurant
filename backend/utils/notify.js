// Sends an event to n8n. Never throws: a failed alert must not break an order.
async function notifyNewOrder(order) {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) return;

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);

    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: ctrl.signal,
      body: JSON.stringify({
        orderId: String(order._id),
        client: order.utilisateur,
        type: order.type,
        table: order.table || "",
        items: order.produits.map((p) => `${p.quantite}x ${p.nom}`).join(", "),
        total: order.total,
        note: order.note || "",
      }),
    });
    clearTimeout(timer);
  } catch (e) {
    console.log("n8n notification skipped:", e.message);
  }
}

module.exports = { notifyNewOrder };
