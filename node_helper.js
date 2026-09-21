const NodeHelper = require("node_helper");
const https = require("https");

module.exports = NodeHelper.create({
  start: function () {
    console.log("[MMM-ShowHTMLWithRetry] Helper initialized.");
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "FETCH_HTML") {
      this.fetchHtml(payload.url, payload.id);
    }
  },

  fetchHtml: function (url, id) {
    const self = this;

    const makeRequest = (targetUrl, redirectCount = 0) => {
      if (redirectCount > 5) {
        self.sendSocketNotification("HTML_FETCH_ERROR", {
          id: id,
          error: "Trop de redirections HTTP"
        });
        return;
      }

      https.get(targetUrl, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          makeRequest(res.headers.location, redirectCount + 1);
          return;
        }

        if (res.statusCode !== 200) {
          self.sendSocketNotification("HTML_FETCH_ERROR", {
            id: id,
            error: `Erreur HTTP ${res.statusCode}`
          });
          return;
        }

        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          self.sendSocketNotification("HTML_FETCHED", {
            id: id,
            html: data
          });
        });

      }).on("error", (err) => {
        self.sendSocketNotification("HTML_FETCH_ERROR", {
          id: id,
          error: err.message
        });
      });
    };

    makeRequest(url);
  }
});