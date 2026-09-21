Module.register("MMM-ShowHTMLWithRetry", {
  defaults: {
    title: "",
    titleFontSize: "18px",
    url: "",
    refreshInterval: 15 * 60 * 1000,
    retryInterval: 1 * 60 * 1000,
    width: "100%",
    height: "auto",
    scaleGrid: 100,
    scaleText: 100,
    showInfo: "n",
    noPhotoPath: "modules/MMM-ShowHTMLWithRetry/images/NoPhoto.png"
  },

  getStyles: function () {
    return ["MMM-ShowHTMLWithRetry.css"];
  },

  start: function () {
    this.loadedContent = null;
    this.isError = false;
    this.errorMessage = "";
    this.retryTimer = null;
    this.refreshTimer = null;

    if (this.config.url) {
      this.fetchData();
      this.scheduleRefresh();
    }
  },

  getFormattedUrl: function () {
    let fetchUrl = this.config.url;
    if (!fetchUrl) return "";

    if (!fetchUrl.includes("scaleGrid=")) {
      fetchUrl += `&scaleGrid=${this.config.scaleGrid}`;
    }
    if (!fetchUrl.includes("scaleText=")) {
      fetchUrl += `&scaleText=${this.config.scaleText}`;
    }
    if (!fetchUrl.includes("showInfo=")) {
      fetchUrl += `&showInfo=${this.config.showInfo}`;
    }
    return fetchUrl;
  },

  fetchData: function () {
    const finalUrl = this.getFormattedUrl();
    this.sendSocketNotification("FETCH_HTML", {
      id: this.identifier,
      url: finalUrl
    });
  },

  scheduleRefresh: function () {
    const self = this;
    if (this.refreshTimer) clearInterval(this.refreshTimer);

    this.refreshTimer = setInterval(function () {
      self.fetchData();
    }, this.config.refreshInterval);
  },

  scheduleRetry: function () {
    const self = this;
    if (this.retryTimer) clearTimeout(this.retryTimer);

    this.retryTimer = setTimeout(function () {
      self.fetchData();
    }, this.config.retryInterval);
  },

  socketNotificationReceived: function (notification, payload) {
    if (payload.id !== this.identifier) return;

    if (notification === "HTML_FETCHED") {
      if (this.retryTimer) clearTimeout(this.retryTimer);
      this.loadedContent = payload.html;
      this.isError = false;
      this.errorMessage = "";
      this.updateDom(300);

    } else if (notification === "HTML_FETCH_ERROR") {
      this.isError = true;
      this.errorMessage = payload.error;
      this.updateDom(300);
      this.scheduleRetry();
    }
  },

  getDom: function () {
    const wrapper = document.createElement("div");
    wrapper.className = "mmm-showhtml-wrapper";

    if (this.config.width) {
      wrapper.style.width = this.config.width;
    }
    if (this.config.height && this.config.height !== "auto") {
      wrapper.style.height = this.config.height;
    }

    if (this.config.title) {
      const titleEl = document.createElement("div");
      titleEl.className = "mmm-showhtml-title";
      titleEl.style.fontSize = this.config.titleFontSize;
      titleEl.innerHTML = this.config.title;
      wrapper.appendChild(titleEl);
    }

    if (this.isError) {
      const errContainer = document.createElement("div");
      errContainer.className = "mmm-showhtml-error-container";

      const img = document.createElement("img");
      img.src = this.config.noPhotoPath;
      img.className = "mmm-showhtml-nophoto";
      errContainer.appendChild(img);

      const errText = document.createElement("div");
      errText.className = "mmm-showhtml-errortext";
      errText.innerText = this.errorMessage || "Erreur de chargement";
      errContainer.appendChild(errText);

      wrapper.appendChild(errContainer);

    } else if (this.loadedContent) {
      const contentEl = document.createElement("div");
      contentEl.className = "mmm-showhtml-content";
      contentEl.innerHTML = this.loadedContent;
      wrapper.appendChild(contentEl);

    } else {
      const loadingEl = document.createElement("div");
      loadingEl.className = "mmm-showhtml-errortext";
      loadingEl.innerText = "Chargement...";
      wrapper.appendChild(loadingEl);
    }

    return wrapper;
  }
});