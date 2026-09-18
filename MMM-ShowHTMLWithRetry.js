Module.register("MMM-ShowHTMLWithRetry", {
  defaults: {
    title: "",
    titleFontSize: "16px",
    url: "",
    refreshInterval: 15 * 60 * 1000,
    retryInterval: 1 * 60 * 1000,
    width: "100%",
    height: "auto",
    noPhotoPath: "modules/MMM-ShowHTMLWithRetry/images/NoPhoto.png"
  },

  getStyles: function () {
    return ["MMM-ShowHTMLWithRetry.css"];
  },

  start: function () {
    Log.info(`Starting module: ${this.name}`);
    this.htmlContent = null;
    this.errorMessage = null;
    this.loadedOnce = false;

    if (this.config.url) {
      this.getData();
    } else {
      this.errorMessage = "Configuration error: 'url' parameter is missing.";
      this.updateDom();
    }
  },

  getData: function () {
    this.sendSocketNotification("FETCH_HTML", {
      url: this.config.url,
      identifier: this.identifier
    });
  },

  socketNotificationReceived: function (notification, payload) {
    if (payload.identifier !== this.identifier) return;

    if (notification === "HTML_FETCHED") {
      this.htmlContent = payload.data;
      this.errorMessage = null;
      this.loadedOnce = true;
      this.updateDom();
      this.scheduleUpdate(this.config.refreshInterval);

    } else if (notification === "HTML_FETCH_ERROR") {
      Log.error(`[${this.name}] Fetch error: ${payload.error}`);
      
      if (!this.loadedOnce) {
        this.errorMessage = payload.error;
        this.updateDom();
      }

      this.scheduleUpdate(this.config.retryInterval);
    }
  },

  scheduleUpdate: function (delay) {
    clearTimeout(this.updateTimer);
    this.updateTimer = setTimeout(() => {
      this.getData();
    }, delay);
  },

  getDom: function () {
    const wrapper = document.createElement("div");
    wrapper.className = "mmm-showhtml-wrapper";
    wrapper.style.width = this.config.width;
    wrapper.style.height = this.config.height;

    if (this.config.title) {
      const titleEl = document.createElement("div");
      titleEl.className = "mmm-showhtml-title";
      titleEl.style.fontSize = this.config.titleFontSize;
      titleEl.innerText = this.config.title;
      wrapper.appendChild(titleEl);
    }

    if (this.htmlContent) {
      const contentEl = document.createElement("div");
      contentEl.className = "mmm-showhtml-content";
      contentEl.innerHTML = this.htmlContent;
      wrapper.appendChild(contentEl);

    } else if (this.errorMessage) {
      const errorContainer = document.createElement("div");
      errorContainer.className = "mmm-showhtml-error-container";

      const imgEl = document.createElement("img");
      imgEl.src = this.config.noPhotoPath;
      imgEl.className = "mmm-showhtml-nophoto";

      const errText = document.createElement("div");
      errText.className = "mmm-showhtml-errortext";
      errText.innerText = this.errorMessage;

      errorContainer.appendChild(imgEl);
      errorContainer.appendChild(errText);
      wrapper.appendChild(errorContainer);

    } else {
      const loadingEl = document.createElement("div");
      loadingEl.className = "dimmed light small";
      loadingEl.innerText = "Chargement...";
      wrapper.appendChild(loadingEl);
    }

    return wrapper;
  }
});