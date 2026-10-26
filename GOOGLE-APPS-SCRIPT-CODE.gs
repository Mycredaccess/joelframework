const OWNER_EMAIL = "joelframesworks@gmail.com";
const MAX_ZIP_BYTES = 18 * 1024 * 1024;

function doGet() {
  return ContentService.createTextOutput("Joel Frame Work's order backend is running.");
}

function doPost(e) {
  try {
    const raw = e && e.parameter && e.parameter.payload;
    if (!raw || raw.length > 25 * 1024 * 1024) throw new Error("Missing or oversized payload");
    const order = JSON.parse(raw);
    if (order.to_email !== OWNER_EMAIL) throw new Error("Recipient not allowed");
    const match = String(order.zip_data || "").match(/^data:application\/zip;base64,([A-Za-z0-9+/=]+)$/);
    if (!match) throw new Error("Invalid ZIP data");
    const bytes = Utilities.base64Decode(match[1]);
    if (bytes.length > MAX_ZIP_BYTES) throw new Error("ZIP is larger than 18 MB");
    const filename = String(order.zip_filename || "Joel-Frame-Works-order.zip").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
    const attachment = Utilities.newBlob(bytes, "application/zip", filename);
    const subject = String(order.subject || "New Joel Frame Work order").slice(0, 180);
    const message = String(order.order_message || "New website order received.").slice(0, 12000);
    MailApp.sendEmail({
      to: OWNER_EMAIL,
      subject: subject,
      body: message + "\n\nOrder ZIP is attached. This email was sent by the Joel Frame Work website order form.",
      attachments: [attachment],
      name: "Joel Frame Work Orders"
    });
    return ContentService.createTextOutput("OK");
  } catch (err) {
    console.error(err);
    return ContentService.createTextOutput("ERROR: " + String(err.message || err));
  }
}
