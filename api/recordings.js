module.exports = function handler(req, res) {
  if (req.method === "GET") {
    res.status(200).json({
      ok: true,
      recordings: [],
      message: "Cloud recording storage is not configured for this preview deployment.",
    });
    return;
  }

  if (req.method === "POST") {
    res.status(501).json({
      ok: false,
      error: "Cloud recording storage is not configured. Use the browser download link to save the video.",
    });
    return;
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).json({ ok: false, error: "Method not allowed" });
};
