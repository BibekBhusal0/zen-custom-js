import { browseBotFindbarLLM } from "./llm/index.js";
import { PREFS } from "./utils/prefs.js";
import { parseElement, escapeXmlAttribute } from "../utils/parse.js";
import { createCombobox } from "../utils/combobox.js";
import { createModelField } from "./utils/model-selector.js";
import { ZenuxSettings } from "../utils/settings-modal.js";
import { browseBotFindbar } from "./findbar-ai.uc.js";
import {
  ensureApiKeysLoaded,
  getSecureApiKey,
  isApiKeyPref,
  setSecureApiKey,
} from "./utils/secure.js";

const form = new ZenuxSettings(PREFS);

export const SettingsModal = {
  _modalElement: null,

  _getSafeIdForProvider(providerName) {
    return providerName.replace(/\./g, "-");
  },

  createModalElement() {
    const settingsHtml = this._generateSettingsHtml();
    const container = parseElement(settingsHtml);
    this._modalElement = container;

    const providerCombo = createCombobox({
      id: "pref-llm-provider",
      attrs: { "data-pref": PREFS.LLM_PROVIDER },
      value: PREFS.llmProvider,
      items: Object.entries(browseBotFindbarLLM.AVAILABLE_PROVIDERS).map(([name, provider]) => ({
        value: name,
        label: provider.label,
        image: provider.faviconUrl || "",
      })),
    });

    const placeholder = this._modalElement.querySelector("#llm-provider-selector-placeholder");
    if (placeholder) {
      placeholder.replaceWith(providerCombo);
    }

    for (const [name, provider] of Object.entries(browseBotFindbarLLM.AVAILABLE_PROVIDERS)) {
      const modelPrefKey = provider.modelPref;
      const currentModel = provider.model;

      const modelPlaceholder = this._modalElement.querySelector(
        `#llm-model-selector-placeholder-${this._getSafeIdForProvider(name)}`
      );
      if (modelPlaceholder) {
        const modelSelectorElement = createModelField(provider, {
          id: `pref-${this._getSafeIdForProvider(name)}-model`,
          value: currentModel,
          attrs: { "data-pref": modelPrefKey },
          getApiKey: async () =>
            form.values[provider.apiPref] || (await getSecureApiKey(provider.apiPref)) || "",
          onDynamicLoaded: (combo) => {
            if (combo.value && !form.values[provider.modelPref]) {
              form.values[provider.modelPref] = combo.value;
            }
          },
        });
        modelPlaceholder.replaceWith(modelSelectorElement);
      }
    }

    this._attachEventListeners();
    return container;
  },

  _onPrefChange(prefKey) {
    if (prefKey === PREFS.LLM_PROVIDER) {
      this._updateProviderSpecificSettings(this._modalElement, form.values[prefKey]);
    }
  },

  _attachEventListeners() {
    if (!this._modalElement) return;
    const root = this._modalElement;

    form.attachDismiss(root, () => this.hide());
    form.attachAccordion(root);
    form.attachResetButtons(root, (prefKey) => this._onPrefChange(prefKey));
    form.attachPrefTracking(root, (prefKey) => this._onPrefChange(prefKey));
    form.attachShortcutInputs(root);

    root.querySelector("#browse-bot-save-settings").addEventListener("click", async () => {
      await this.saveSettings();
      this.hide();
      if (browseBotFindbar.enabled) browseBotFindbar.show();
      else browseBotFindbar.destroy();
    });

    root.querySelectorAll(".get-api-key-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const url = e.target.dataset.url;
        if (url) {
          openTrustedLinkIn(url, "tab");
          this.hide();
        }
      });
    });

    const modelInput = root.querySelector("#pref-custom-model");
    if (modelInput) {
      modelInput.addEventListener("input", () => {
        modelInput.classList.remove("verify-success", "verify-error");
        const statusEl = root.querySelector('[data-verify-status="custom"]');
        if (statusEl) {
          statusEl.classList.remove("success", "error");
          statusEl.textContent = "";
        }
      });
    }

    root.querySelectorAll(".verify-model-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const statusEl = root.querySelector('[data-verify-status="custom"]');
        const customModelInput = root.querySelector("#pref-custom-model");
        if (!statusEl) return;

        const baseUrl = form.values[PREFS.CUSTOM_BASE_URL] || "";
        const model = form.values[PREFS.CUSTOM_MODEL] || "";
        const apiKey = form.values[PREFS.CUSTOM_API_KEY] || "";

        const setError = (msg) => {
          statusEl.textContent = msg;
          statusEl.classList.remove("success");
          statusEl.classList.add("error");
          if (customModelInput) {
            customModelInput.classList.remove("verify-success");
            customModelInput.classList.add("verify-error");
          }
        };

        if (!baseUrl) {
          setError("Enter a base URL first");
          return;
        }
        if (!model) {
          setError("Enter a model name");
          return;
        }

        statusEl.textContent = "Verifying...";
        statusEl.classList.remove("success", "error");
        if (customModelInput) {
          customModelInput.classList.remove("verify-success", "verify-error");
        }
        btn.disabled = true;

        try {
          const url = `${baseUrl.replace(/\/+$/, "")}/models/${encodeURIComponent(model)}`;
          const headers = { "Content-Type": "application/json" };
          if (apiKey) {
            headers["Authorization"] = `Bearer ${apiKey}`;
          }
          const response = await fetch(url, { headers });
          if (response.ok) {
            statusEl.textContent = `Model "${model}" exists`;
            statusEl.classList.remove("error");
            statusEl.classList.add("success");
            if (customModelInput) {
              customModelInput.classList.add("verify-success");
              customModelInput.classList.remove("verify-error");
            }
          } else if (response.status === 404) {
            setError(`Model "${model}" not found`);
          } else {
            setError(`Error: ${response.status}`);
          }
        } catch {
          setError("Connection failed");
        } finally {
          btn.disabled = false;
        }
      });
    });

    this._updateProviderSpecificSettings(root, PREFS.llmProvider);
  },

  async saveSettings() {
    for (const prefKey in form.values) {
      if (Object.prototype.hasOwnProperty.call(form.values, prefKey)) {
        if (isApiKeyPref(prefKey)) {
          if (form.values[prefKey]) {
            const maskedKey = "*".repeat(String(form.values[prefKey]).length);
            PREFS.debugLog(`Saving pref ${prefKey} to: ${maskedKey}`);
          }
        } else {
          PREFS.debugLog(`Saving pref ${prefKey} to: ${form.values[prefKey]}`);
        }
        try {
          if (isApiKeyPref(prefKey)) {
            await setSecureApiKey(prefKey, form.values[prefKey] || "");
          } else {
            PREFS.setPref(prefKey, form.values[prefKey]);
          }
        } catch (e) {
          PREFS.debugError(`Error Saving pref for ${prefKey} ${e}`);
        }
      }
    }
    const currentProvider = browseBotFindbarLLM.currentProvider;
    if (!currentProvider.noApiKey && !(await currentProvider.getApiKeyAsync())) {
      browseBotFindbar.expanded = false;
    }
  },

  isOpen() {
    return !!this._modalElement?.isConnected;
  },

  async toggle() {
    if (this.isOpen()) {
      this.hide();
      return;
    }
    await this.show();
  },

  async show() {
    if (this.isOpen()) return;
    await ensureApiKeysLoaded();
    this.createModalElement();
    form.syncFromPrefs(this._modalElement);
    for (const provider of Object.values(browseBotFindbarLLM.AVAILABLE_PROVIDERS)) {
      if (!provider.apiPref) continue;
      const decrypted = await getSecureApiKey(provider.apiPref);
      form.values[provider.apiPref] = decrypted;
      const input = this._modalElement.querySelector(`[data-pref="${provider.apiPref}"]`);
      if (input) input.value = decrypted || "";
    }
    this._updateProviderSpecificSettings(this._modalElement, PREFS.llmProvider);

    document.documentElement.appendChild(this._modalElement);
  },

  hide() {
    form.close();
    if (this._modalElement && this._modalElement.parentNode) {
      this._modalElement.remove();
    }
    this._modalElement = null;
  },

  _updateProviderSpecificSettings(container, selectedProviderName) {
    container.querySelectorAll(".zenux-settings-provider-group").forEach((group) => {
      group.hidden = true;
    });

    const activeGroup = container.querySelector(
      `#${this._getSafeIdForProvider(selectedProviderName)}-settings-group`
    );
    if (activeGroup) {
      activeGroup.hidden = false;

      const modelPrefKey = PREFS[`${selectedProviderName.toUpperCase()}_MODEL`];
      if (modelPrefKey) {
        const modelSelect = activeGroup.querySelector(
          `#pref-${this._getSafeIdForProvider(selectedProviderName)}-model`
        );
        if (modelSelect) {
          modelSelect.value = form.values[modelPrefKey] || PREFS.getPref(modelPrefKey);
        }
      }
      const provider = browseBotFindbarLLM.AVAILABLE_PROVIDERS[selectedProviderName];
      const getApiKeyLink = activeGroup.querySelector(".get-api-key-link");
      if (getApiKeyLink) {
        if (provider.apiKeyUrl) {
          getApiKeyLink.hidden = false;
          getApiKeyLink.dataset.url = provider.apiKeyUrl;
        } else {
          getApiKeyLink.hidden = true;
          delete getApiKeyLink.dataset.url;
        }
      }
    }
  },

  _checkboxSection(
    title,
    settingsArray,
    expanded = true,
    contentBefore = "",
    contentAfter = "",
    resetPrefs = null
  ) {
    const body = settingsArray
      .map((s) => {
        if (s.type === "number") {
          return ZenuxSettings.numberRow(s.label, s.pref, {
            min: s.min,
            max: s.max,
            step: s.step,
            tooltip: s.tooltip,
          });
        }
        return ZenuxSettings.checkboxRow(s.label, s.pref);
      })
      .join("");
    return ZenuxSettings.accordionSection({
      title,
      expanded,
      resetPrefs: resetPrefs ?? settingsArray.map((s) => s.pref),
      before: contentBefore,
      body,
      after: contentAfter,
    });
  },

  _generateSettingsHtml() {
    const findbarSettings = [
      { label: "Enable AI Findbar", pref: PREFS.ENABLED },
      { label: "Minimal Mode (similar to arc)", pref: PREFS.MINIMAL },
      { label: "Persist Chat (don't persist when browser closes)", pref: PREFS.PERSIST },
      { label: "Enable Drag and Drop", pref: PREFS.DND_ENABLED },
      { label: "Remember Dimensions", pref: PREFS.REMEMBER_DIMENSIONS },
    ];
    const findbarSectionHtml = this._checkboxSection(
      "Findbar AI",
      findbarSettings,
      true,
      "",
      [
        ZenuxSettings.selectRow(
          "Position",
          PREFS.POSITION,
          {
            "top-left": "Top Left",
            "top-right": "Top Right",
            "bottom-left": "Bottom Left",
            "bottom-right": "Bottom Right",
          },
          { id: "pref-position" }
        ),
        ZenuxSettings.selectRow(
          "Background Style",
          PREFS.BACKGROUND_STYLE,
          {
            solid: "Solid",
            acrylic: "Acrylic",
            pseudo: "Pseudo",
          },
          { id: "pref-background-style" }
        ),
      ].join(""),
      [...findbarSettings.map((s) => s.pref), PREFS.POSITION, PREFS.BACKGROUND_STYLE]
    );

    const urlbarSettings = [
      { label: "Enable URLBar AI", pref: PREFS.URLBAR_AI_ENABLED },
      { label: "Enable Animations", pref: PREFS.URLBAR_AI_ANIMATIONS_ENABLED },
      { label: "Hide Suggestions", pref: PREFS.URLBAR_AI_HIDE_SUGGESTIONS },
    ];
    const urlbarSectionHtml = this._checkboxSection("URLBar AI", urlbarSettings, false);

    const librarySettings = [{ label: "Enable Library AI", pref: PREFS.LIBRARY_ENABLED }];
    const librarySectionHtml = this._checkboxSection(
      "Library AI",
      librarySettings,
      true,
      "",
      ZenuxSettings.selectRow(
        "Mode",
        PREFS.LIBRARY_MODE,
        {
          chat: "Chat (no tools, no page context)",
          agent: "Agent (full browser tool-belt)",
          build: "Build (live browser styling + Sine mods)",
        },
        { id: "pref-library-mode" }
      ),
      [...librarySettings.map((s) => s.pref), PREFS.LIBRARY_MODE]
    );

    const shortcutsSectionHtml = ZenuxSettings.accordionSection({
      title: "Keyboard Shortcuts",
      expanded: true,
      resetPrefs: [PREFS.SHORTCUT_FINDBAR, PREFS.SHORTCUT_URLBAR, PREFS.SHORTCUT_LIBRARY],
      body: [
        ZenuxSettings.shortcutRow("Open Findbar AI", PREFS.SHORTCUT_FINDBAR),
        ZenuxSettings.shortcutRow("Toggle URLBar AI", PREFS.SHORTCUT_URLBAR),
        ZenuxSettings.shortcutRow("Open BrowseBot Library", PREFS.SHORTCUT_LIBRARY),
      ].join(""),
    });

    const aiBehaviorSettings = [
      { label: "Enable Citations", pref: PREFS.CITATIONS_ENABLED },
      { label: "Stream Response", pref: PREFS.STREAM_ENABLED },
      { label: "Conformation before tool call", pref: PREFS.CONFORMATION },
      {
        label: "Max Context Chars (0 = unlimited)",
        pref: PREFS.MAX_CONTEXT_CHARS,
        type: "number",
        step: 1000,
        min: 0,
        max: 200000,
        tooltip: "Maximum page or transcript characters sent to the AI per message.",
      },
    ];
    const maxToolCallsHtml = ZenuxSettings.numberRow(
      "Max Tool Calls (Maximum number of messages to send AI back to back)",
      PREFS.MAX_TOOL_CALLS,
      { id: "pref-max-tool-calls" }
    );
    const aiBehaviorSectionHtml = ZenuxSettings.accordionSection({
      title: "AI Behavior",
      expanded: true,
      resetPrefs: [...aiBehaviorSettings.map((s) => s.pref), PREFS.MAX_TOOL_CALLS],
      body: aiBehaviorSettings
        .map((s) => {
          if (s.type === "number") {
            return ZenuxSettings.numberRow(s.label, s.pref, {
              min: s.min,
              max: s.max,
              step: s.step,
              tooltip: s.tooltip,
            });
          }
          return ZenuxSettings.checkboxRow(s.label, s.pref);
        })
        .join(""),
      after: maxToolCallsHtml,
    });

    const systemPromptRows = [
      ["Findbar AI", PREFS.FINDBAR_SYSTEM_PROMPT],
      ["URL Bar AI", PREFS.URLBAR_SYSTEM_PROMPT],
      ["Library Chat Mode", PREFS.LIBRARY_CHAT_SYSTEM_PROMPT],
      ["Library Agent Mode", PREFS.LIBRARY_AGENT_SYSTEM_PROMPT],
      ["Library Build Mode", PREFS.LIBRARY_BUILD_SYSTEM_PROMPT],
    ];
    const systemPromptsSectionHtml = ZenuxSettings.accordionSection({
      title: "System Prompts",
      expanded: false,
      resetPrefs: systemPromptRows.map(([, pref]) => pref),
      body: systemPromptRows
        .map(([label, pref]) =>
          ZenuxSettings.textareaRow(label, pref, { placeholder: "Pretend like ....", rows: 3 })
        )
        .join(""),
    });

    const contextMenuSettings = [
      { label: "Enable Context Menu (right click menu)", pref: PREFS.CONTEXT_MENU_ENABLED },
      {
        label: "Auto Send from Context Menu",
        pref: PREFS.CONTEXT_MENU_AUTOSEND,
      },
    ];
    const contextMenuCommandsHtml = [
      ZenuxSettings.textareaRow(
        "Command when no text is selected",
        PREFS.CONTEXT_MENU_COMMAND_NO_SELECTION,
        { rows: 3, id: "pref-context-menu-command-no-selection" }
      ),
      ZenuxSettings.textareaRow(
        "Command when text is selected. Use {selection} for the selected text.",
        PREFS.CONTEXT_MENU_COMMAND_WITH_SELECTION,
        { rows: 3, id: "pref-context-menu-command-with-selection" }
      ),
    ].join("");
    const contextMenuSectionHtml = ZenuxSettings.accordionSection({
      title: "Context Menu",
      expanded: false,
      resetPrefs: [
        ...contextMenuSettings.map((s) => s.pref),
        PREFS.CONTEXT_MENU_COMMAND_NO_SELECTION,
        PREFS.CONTEXT_MENU_COMMAND_WITH_SELECTION,
      ],
      body: contextMenuSettings.map((s) => ZenuxSettings.checkboxRow(s.label, s.pref)).join(""),
      after: contextMenuCommandsHtml,
    });

    let llmProviderSettingsHtml = "";
    for (const [name, provider] of Object.entries(browseBotFindbarLLM.AVAILABLE_PROVIDERS)) {
      const modelPrefKey = provider.modelPref;

      let apiInputHtml;
      if (provider.baseUrlPref) {
        const baseUrlPrefKey = provider.baseUrlPref;
        const safeId = this._getSafeIdForProvider(name);
        apiInputHtml = ZenuxSettings.textRow("Base URL", baseUrlPrefKey, {
          placeholder: "http://localhost:11434/api",
          id: `pref-${safeId}-base-url`,
        });
      } else if (name === "custom") {
        apiInputHtml = [
          ZenuxSettings.textRow("Base URL", PREFS.CUSTOM_BASE_URL, {
            placeholder: "https://api.your-provider.com/v1",
            id: "pref-custom-base-url",
          }),
          ZenuxSettings.textRow("API Key", PREFS.CUSTOM_API_KEY, {
            placeholder: "Enter Custom API Key",
            password: true,
            id: "pref-custom-api-key",
          }),
        ].join("");
      } else {
        const apiPrefKey = PREFS[`${name.toUpperCase()}_API_KEY`];
        const keyLabel = name === "pollinations" ? "API Key (optional)" : "API Key";
        const keyPlaceholder =
          name === "pollinations"
            ? "Optional, unlocks more models and tool use"
            : `Enter ${provider.label} API Key`;
        apiInputHtml = apiPrefKey
          ? ZenuxSettings.textRow(keyLabel, apiPrefKey, {
              placeholder: keyPlaceholder,
              password: true,
              id: `pref-${this._getSafeIdForProvider(name)}-api-key`,
            })
          : "";
      }

      const modelSelectPlaceholderHtml = modelPrefKey
        ? `
        <div class="zenux-setting-item" data-provider-model="${escapeXmlAttribute(name)}">
          <label for="pref-${this._getSafeIdForProvider(name)}-model">Model</label>
          <div class="model-input-row">
            <div id="llm-model-selector-placeholder-${this._getSafeIdForProvider(name)}"></div>
             ${name === "custom" ? '<button class="verify-model-btn zenux-btn-ghost" data-verify-model="custom">Verify</button>' : ""}
          </div>
          ${name === "custom" ? '<span class="verify-model-status" data-verify-status="custom"></span>' : ""}
        </div>
      `
        : "";

      llmProviderSettingsHtml += ZenuxSettings.providerGroup({
        id: `${this._getSafeIdForProvider(name)}-settings-group`,
        title: provider.label,
        headerAfter: `<button class="get-api-key-link zenux-btn-ghost" data-url="${escapeXmlAttribute(provider.apiKeyUrl || "")}"${provider.apiKeyUrl ? "" : " hidden"}>Get API Key</button>`,
        body: apiInputHtml + modelSelectPlaceholderHtml,
      });
    }

    const llmProvidersResetPrefs = [
      PREFS.LLM_PROVIDER,
      PREFS.OLLAMA_BASE_URL,
      PREFS.CUSTOM_BASE_URL,
      ...Object.values(browseBotFindbarLLM.AVAILABLE_PROVIDERS)
        .flatMap((p) => [p.modelPref, PREFS[`${p.name.toUpperCase()}_API_KEY`]])
        .filter(Boolean),
    ];

    const llmProvidersSectionHtml = ZenuxSettings.accordionSection({
      title: "LLM Providers",
      expanded: false,
      resetPrefs: llmProvidersResetPrefs,
      body: `
        <div class="zenux-setting-item">
          <label for="pref-llm-provider">Select Provider</label>
          <div id="llm-provider-selector-placeholder"></div>
        </div>
        ${llmProviderSettingsHtml}
      `,
    });

    const advancedLLMSettings = [
      {
        label: "Temperature",
        pref: PREFS.LLM_TEMPERATURE,
        type: "number",
        step: 0.1,
        min: 0,
        max: 2,
        tooltip: "Controls randomness. Lower values are more deterministic.",
      },
      {
        label: "Top P",
        pref: PREFS.LLM_TOP_P,
        type: "number",
        step: 0.1,
        min: 0,
        max: 1,
        tooltip: "Nucleus sampling. Limits token selection to top cumulative probability.",
      },
      {
        label: "Top K",
        pref: PREFS.LLM_TOP_K,
        type: "number",
        step: 1,
        min: 0,
        max: 200,
        tooltip: "Limits sampling to the top K tokens. Removes low probability responses.",
      },
      {
        label: "Presence Penalty",
        pref: PREFS.LLM_PRESENCE_PENALTY,
        type: "number",
        step: 0.1,
        min: -2,
        max: 2,
        tooltip:
          "Penalizes repeated tokens. Reduces repetition of information already in the context.",
      },
      {
        label: "Frequency Penalty",
        pref: PREFS.LLM_FREQUENCY_PENALTY,
        type: "number",
        step: 0.1,
        min: -2,
        max: 2,
        tooltip: "Penalizes frequent tokens. Discourages repetition of the same words/phrases.",
      },
      {
        label: "Max Output Tokens",
        pref: PREFS.LLM_MAX_OUTPUT_TOKENS,
        type: "number",
        step: 1,
        min: 1,
        max: 32000,
        tooltip: "Maximum number of tokens to generate.",
      },
    ];

    const advancedLLMSectionHtml = this._checkboxSection(
      "Advanced LLM Settings",
      advancedLLMSettings,
      false
    );

    const browserFindbarSettings = [
      { label: "Find as you Type", pref: "accessibility.typeaheadfind" },
      {
        label: "Enable sound (when word not found)",
        pref: "accessibility.typeaheadfind.enablesound",
      },
      { label: "Entire Word", pref: "findbar.entireword" },
      { label: "Highlight All", pref: "findbar.highlightAll" },
    ];
    const browserSettingsHtml = this._checkboxSection(
      "Browser Findbar",
      browserFindbarSettings,
      false
    );

    const devSettings = [{ label: "Debug Mode (logs in console)", pref: PREFS.DEBUG_MODE }];
    const devSectionHtml = this._checkboxSection("Development", devSettings, false);

    const bodyHtml = [
      findbarSectionHtml,
      urlbarSectionHtml,
      librarySectionHtml,
      shortcutsSectionHtml,
      aiBehaviorSectionHtml,
      systemPromptsSectionHtml,
      contextMenuSectionHtml,
      llmProvidersSectionHtml,
      advancedLLMSectionHtml,
      browserSettingsHtml,
      devSectionHtml,
    ].join("");

    return ZenuxSettings.shell({
      title: "BrowseBot Settings",
      bodyHTML: bodyHtml,
      closeId: "browse-bot-close-settings",
      saveId: "browse-bot-save-settings",
      modalClass: "browse-bot-settings-modal",
    });
  },
};

export default SettingsModal;
