import type {
  ViewportSystemConfig,
  ViewportSystemState,
  ViewportLayout,
  ViewportEvent,
  ViewportEventListener,
} from './ViewportState.js';
import { createViewportPanel } from './ViewportPanel.js';

/**
 * Viewport manager configuration
 */
export interface ViewportManagerConfig extends ViewportSystemConfig {
  /** Whether to enable automatic rendering */
  autoRender?: boolean;
  /** Target FPS for rendering */
  targetFPS?: number;
  /** Whether to enable window resize handling */
  enableResize?: boolean;
}

/**
 * Creates a viewport manager for the 2x2 viewport system
 * @param config Viewport manager configuration
 * @returns The viewport manager instance
 */
export function createViewportManager(config: ViewportManagerConfig): {
  state: ViewportSystemState;
  init: () => void;
  destroy: () => void;
  setLayout: (layout: ViewportLayout) => void;
  maximizePanel: (panelId: string) => void;
  restoreLayout: () => void;
  addEventListener: (type: string, listener: ViewportEventListener) => void;
  removeEventListener: (type: string, listener: ViewportEventListener) => void;
  render: () => void;
  resize: () => void;
} {
  const {
    scene,
    container,
    layout = '2x2',
    panels: panelConfigs,
    gridSettings = {},
    enableFullscreen = true,
    enableViewSwitching = true,
    autoRender = true,
    targetFPS = 60,
    enableResize = true,
  } = config;

  // Create system state
  const state: ViewportSystemState = {
    config: {
      scene,
      container,
      layout,
      panels: panelConfigs,
      gridSettings,
      enableFullscreen,
      enableViewSwitching,
    },
    panels: new Map(),
    maximizedPanelId: null,
    isInitialized: false,
    animationFrameId: null,
  };

  // Event listeners storage
  const eventListeners = new Map<string, Set<ViewportEventListener>>();

  // Add event listener helper
  function addEventListener(
    type: string,
    listener: ViewportEventListener
  ): void {
    if (!eventListeners.has(type)) {
      eventListeners.set(type, new Set());
    }
    eventListeners.get(type)!.add(listener);
  }

  // Remove event listener helper
  function removeEventListener(
    type: string,
    listener: ViewportEventListener
  ): void {
    const listeners = eventListeners.get(type);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  // Emit event helper
  function emitEvent(event: ViewportEvent): void {
    const listeners = eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach((listener) => listener(event));
    }
  }

  // Create viewport panels
  const viewportPanels = new Map<
    string,
    ReturnType<typeof createViewportPanel>
  >();

  // Initialize function
  function init(): void {
    if (state.isInitialized) return;

    // Clear container
    container.innerHTML = '';
    container.style.cssText = `
      width: 100%;
      height: 100%;
      display: flex;
      flex-wrap: wrap;
      background: #1a1a1a;
    `;

    // Create panels
    panelConfigs.forEach((panelConfig) => {
      const panel = createViewportPanel(panelConfig, scene, gridSettings);
      viewportPanels.set(panelConfig.id, panel);
      state.panels.set(panelConfig.id, panel.state);

      // Add panel event listeners
      panel.addEventListener('preset-changed', (event) => {
        if (event.preset !== undefined) {
          emitEvent({
            type: 'preset-changed',
            panelId: event.panelId,
            preset: event.preset,
          });
        }
      });

      panel.addEventListener('panel-created', (event) => {
        emitEvent({
          type: 'panel-created',
          panelId: event.panelId,
        });
      });

      panel.addEventListener('panel-destroyed', (event) => {
        emitEvent({
          type: 'panel-destroyed',
          panelId: event.panelId,
        });
      });
    });

    // Apply initial layout
    setLayout(layout);

    // Setup window resize handler
    if (enableResize) {
      window.addEventListener('resize', resize);
    }

    // Start rendering
    if (autoRender) {
      startRendering();
    }

    state.isInitialized = true;

    emitEvent({
      type: 'layout-changed',
      layout,
    });
  }

  // Set layout function
  function setLayout(newLayout: ViewportLayout): void {
    state.config.layout = newLayout;

    // Clear container
    container.innerHTML = '';

    // Add panels based on layout
    const panelStates = Array.from(state.panels.values());

    switch (newLayout) {
      case '2x2':
        container.style.flexDirection = 'row';
        container.style.flexWrap = 'wrap';

        panelStates.forEach((panelState, _index) => {
          const panel = viewportPanels.get(panelState.id);
          if (panel) {
            panelState.element.style.width = '50%';
            panelState.element.style.height = '50%';
            container.appendChild(panelState.element);
            panel.resize(container.clientWidth / 2, container.clientHeight / 2);
          }
        });
        break;

      case '1x1':
        container.style.flexDirection = 'row';
        container.style.flexWrap = 'nowrap';

        // Show only the maximized panel
        if (state.maximizedPanelId) {
          const panelState = state.panels.get(state.maximizedPanelId);
          const panel = viewportPanels.get(state.maximizedPanelId);
          if (panelState && panel) {
            panelState.element.style.width = '100%';
            panelState.element.style.height = '100%';
            container.appendChild(panelState.element);
            panel.resize(container.clientWidth, container.clientHeight);
          }
        }
        break;

      case '1x2':
        container.style.flexDirection = 'row';
        container.style.flexWrap = 'nowrap';

        panelStates.forEach((panelState, _index) => {
          const panel = viewportPanels.get(panelState.id);
          if (panel) {
            panelState.element.style.width = '50%';
            panelState.element.style.height = '100%';
            container.appendChild(panelState.element);
            panel.resize(container.clientWidth / 2, container.clientHeight);
          }
        });
        break;

      case '2x1':
        container.style.flexDirection = 'column';
        container.style.flexWrap = 'nowrap';

        panelStates.forEach((panelState, _index) => {
          const panel = viewportPanels.get(panelState.id);
          if (panel) {
            panelState.element.style.width = '100%';
            panelState.element.style.height = '50%';
            container.appendChild(panelState.element);
            panel.resize(container.clientWidth, container.clientHeight / 2);
          }
        });
        break;
    }

    emitEvent({
      type: 'layout-changed',
      layout: newLayout,
    });
  }

  // Maximize panel function
  function maximizePanel(panelId: string): void {
    if (!state.panels.has(panelId)) return;

    // Restore any currently maximized panel
    if (state.maximizedPanelId && state.maximizedPanelId !== panelId) {
      const currentPanel = state.panels.get(state.maximizedPanelId);
      if (currentPanel) {
        currentPanel.isMaximized = false;
      }
    }

    // Maximize the target panel
    const targetPanel = state.panels.get(panelId);
    if (targetPanel) {
      targetPanel.isMaximized = true;
      state.maximizedPanelId = panelId;
      setLayout('1x1');

      emitEvent({
        type: 'maximized',
        panelId,
      });
    }
  }

  // Restore layout function
  function restoreLayout(): void {
    if (state.maximizedPanelId) {
      const panel = state.panels.get(state.maximizedPanelId);
      if (panel) {
        panel.isMaximized = false;
      }
      state.maximizedPanelId = null;
      setLayout('2x2');

      emitEvent({
        type: 'restored',
      });
    }
  }

  // Resize function
  function resize(): void {
    const panelStates = Array.from(state.panels.values());

    switch (state.config.layout) {
      case '2x2':
        panelStates.forEach((panelState) => {
          const panel = viewportPanels.get(panelState.id);
          if (panel) {
            panel.resize(container.clientWidth / 2, container.clientHeight / 2);
          }
        });
        break;

      case '1x1':
        if (state.maximizedPanelId) {
          const panel = viewportPanels.get(state.maximizedPanelId);
          if (panel) {
            panel.resize(container.clientWidth, container.clientHeight);
          }
        }
        break;

      case '1x2':
        panelStates.forEach((panelState) => {
          const panel = viewportPanels.get(panelState.id);
          if (panel) {
            panel.resize(container.clientWidth / 2, container.clientHeight);
          }
        });
        break;

      case '2x1':
        panelStates.forEach((panelState) => {
          const panel = viewportPanels.get(panelState.id);
          if (panel) {
            panel.resize(container.clientWidth, container.clientHeight / 2);
          }
        });
        break;
    }
  }

  // Render function
  function render(): void {
    viewportPanels.forEach((panel) => {
      panel.render();
    });
  }

  // Start rendering loop
  function startRendering(): void {
    const frameInterval = 1000 / targetFPS;
    let lastFrameTime = 0;

    function renderLoop(currentTime: number): void {
      if (currentTime - lastFrameTime >= frameInterval) {
        render();
        lastFrameTime = currentTime;
      }
      state.animationFrameId = requestAnimationFrame(renderLoop);
    }

    state.animationFrameId = requestAnimationFrame(renderLoop);
  }

  // Stop rendering loop
  function stopRendering(): void {
    if (state.animationFrameId) {
      cancelAnimationFrame(state.animationFrameId);
      state.animationFrameId = null;
    }
  }

  // Destroy function
  function destroy(): void {
    // Stop rendering
    stopRendering();

    // Remove window resize listener
    if (enableResize) {
      window.removeEventListener('resize', resize);
    }

    // Destroy all panels
    viewportPanels.forEach((panel) => {
      panel.destroy();
    });

    // Clear containers
    viewportPanels.clear();
    state.panels.clear();
    container.innerHTML = '';

    // Clear event listeners
    eventListeners.clear();

    state.isInitialized = false;
  }

  return {
    state,
    init,
    destroy,
    setLayout,
    maximizePanel,
    restoreLayout,
    addEventListener,
    removeEventListener,
    render,
    resize,
  };
}
