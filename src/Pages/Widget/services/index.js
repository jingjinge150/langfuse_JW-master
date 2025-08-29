// src/Pages/Widget/services/index.js
import { PreviewAPI } from "./preview";
import { WidgetsAPI } from "./widgets";
import { FiltersAPI } from "./filters";

class WidgetAPI extends PreviewAPI {
  constructor() {
    super();
    this._widgets = new WidgetsAPI();
    this._filters = new FiltersAPI();
  }

  // Widget management methods
  async getWidgets(...args) {
    return this._widgets.getWidgets(...args);
  }

  async deleteWidget(id) {
    return this._widgets.deleteWidget(id);
  }

  async createWidget(payload) {
    return this._widgets.createWidget(payload);
  }

  async testConnection() {
    try {
      await this._widgets.getWidgets(1, 1, "DESC");
      return { success: true };
    } catch (e) {
      return { success: false, message: e?.message || String(e) };
    }
  }

  // Filter methods (passthrough to FiltersAPI)
  async getFilterColumns(view = "traces") {
    return this._filters.getFilterColumns(view);
  }

  async getFilterValues(params) {
    return this._filters.getFilterValues(params);
  }

  async getOptions(view, options) {
    return this._filters.getOptions(view, options);
  }
}

const api = new WidgetAPI();

// Individual API exports for compatibility
export const widgetListAPI = new WidgetsAPI();
export const filtersAPI = new FiltersAPI();

export default api;
