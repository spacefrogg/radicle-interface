import type { BaseUrl } from "@httpd-client";

import configJson from "@app/config.json";

export interface Config {
  nodes: {
    defaultHttpdPort: number;
    defaultLocalHttpdPort: number;
    defaultNodePort: number;
    defaultHttpdScheme: string;
    pinned: { baseUrl: BaseUrl }[];
  };
  projects: {
    pinned: {
      name: string;
      id: string;
      baseUrl: BaseUrl;
    }[];
  };
}

function getConfig(): Config {
  if (window.VITEST) {
    return {
      nodes: {
        defaultHttpdPort: 8081,
        defaultLocalHttpdPort: 8081,
        defaultHttpdScheme: "http",
        defaultNodePort: 8776,
        pinned: [],
      },
      projects: { pinned: [] },
    };
  } else if (window.PLAYWRIGHT) {
    return window.APP_CONFIG;
  } else {
    // In dev and production environments we use data from config.json.
    return configJson;
  }
}

export const config = getConfig();
