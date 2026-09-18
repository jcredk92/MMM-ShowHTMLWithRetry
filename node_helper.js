const NodeHelper = require("node_helper");
const https = require("https");

module.exports = NodeHelper.create({
  start: function () {
    console.log(`Starting node_helper for: ${this.name}`);
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "FETCH_HTML") {
      this.fetchHtml(payload.url, payload.identifier);
    }
  },

  fetchHtml: function (url, identifier) {
    const self = this;

    const request = (targetUrl, maxRedirects = 5) => {
      if (maxRedirects === 0) {
        self.sendSocketNotification("HTML_FETCH_ERROR", {
          identifier: identifier,
          error: "Too many HTTP redirects"
        });
        return;
      }

      https.get(targetUrl, (res) => {
        // Suivi des redirections 301 / 302 de Google
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          request(res.headers.location, maxRedirects - 1);
          return;
        }

        if (res.statusCode < 200 || res.statusCode >= 300) {
          self.sendSocketNotification("HTML_FETCH_ERROR", {
            identifier: identifier,
            error: `HTTP Error ${res.statusCode}`
          });
          return;
        }

        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => {
          // Si Google renvoie une page d'erreur de connexion au lieu du tableau
          if (data.includes("accounts.google.com") || data.includes("Service-Login")) {
            self.sendSocketNotification("HTML_FETCH_ERROR", {
              identifier: identifier,
              error: "Google Web App Access Denied. Check deployment permissions (Must be 'Anyone')."
            });
            return;
          }

          self.sendSocketNotification("HTML_FETCHED", {
            identifier: identifier,
            data: data
          });
        });
      }).on("error", (err) => {
        self.sendSocketNotification("HTML_FETCH_ERROR", {
          identifier: identifier,
          error: err.message || "Network request failed"
        });
      });
    };

    request(url);
  }
});