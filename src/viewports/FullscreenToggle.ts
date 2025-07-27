/**
 * Fullscreen toggle configuration
 */
export interface FullscreenToggleConfig {
  /** Button position */
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  /** Button theme */
  theme?: 'light' | 'dark';
  /** Whether to enable double-click to toggle */
  enableDoubleClick?: boolean;
  /** Custom CSS class for styling */
  className?: string;
}

/**
 * Fullscreen toggle event types
 */
export type FullscreenEventType = 'maximize' | 'restore' | 'toggle';

/**
 * Fullscreen toggle event data
 */
export interface FullscreenEvent {
  type: FullscreenEventType;
  panelId: string;
  isMaximized: boolean;
}

/**
 * Fullscreen toggle event listener
 */
export type FullscreenEventListener = (event: FullscreenEvent) => void;

/**
 * Creates a fullscreen toggle button for a viewport panel
 * @param panelId The panel ID this toggle belongs to
 * @param config Toggle configuration
 * @returns The toggle element and event emitter
 */
export function createFullscreenToggle(
  panelId: string,
  config: FullscreenToggleConfig = {}
): {
  element: HTMLElement;
  addEventListener: (type: FullscreenEventType, listener: FullscreenEventListener) => void;
  removeEventListener: (type: FullscreenEventType, listener: FullscreenEventListener) => void;
  setMaximized: (maximized: boolean) => void;
  destroy: () => void;
} {
  const {
    position = 'top-right',
    theme = 'dark',
    enableDoubleClick = true,
    className = ''
  } = config;

  // Create toggle container
  const toggleContainer = document.createElement('div');
  toggleContainer.className = `viewport-fullscreen-toggle ${className}`;
  toggleContainer.style.cssText = `
    position: absolute;
    z-index: 1000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 12px;
    user-select: none;
  `;

  // Position the toggle
  switch (position) {
    case 'top-right':
      toggleContainer.style.top = '8px';
      toggleContainer.style.right = '8px';
      break;
    case 'bottom-right':
      toggleContainer.style.bottom = '8px';
      toggleContainer.style.right = '8px';
      break;
    case 'top-left':
      toggleContainer.style.top = '8px';
      toggleContainer.style.left = '8px';
      break;
    case 'bottom-left':
      toggleContainer.style.bottom = '8px';
      toggleContainer.style.left = '8px';
      break;
  }

  // Create toggle button
  const toggleButton = document.createElement('button');
  toggleButton.className = 'viewport-fullscreen-button';
  toggleButton.style.cssText = `
    background: ${theme === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)'};
    border: 1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
    border-radius: 4px;
    color: ${theme === 'dark' ? '#ffffff' : '#000000'};
    cursor: pointer;
    padding: 6px;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  `;

  // Event listeners storage
  const eventListeners = new Map<FullscreenEventType, Set<FullscreenEventListener>>();

  // Add event listener helper
  function addEventListener(type: FullscreenEventType, listener: FullscreenEventListener): void {
    if (!eventListeners.has(type)) {
      eventListeners.set(type, new Set());
    }
    eventListeners.get(type)!.add(listener);
  }

  // Remove event listener helper
  function removeEventListener(type: FullscreenEventType, listener: FullscreenEventListener): void {
    const listeners = eventListeners.get(type);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  // Emit event helper
  function emitEvent(event: FullscreenEvent): void {
    const listeners = eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => listener(event));
    }
  }

  // State
  let isMaximized = false;

  // Update button icon
  function updateButtonIcon(): void {
    if (isMaximized) {
      toggleButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M3 3h3v1H4v2H3V3zm7 0h3v3h-1V4h-2V3zm-7 7v3h3v-1H4v-2H3zm10-2v2h-2v1h3V8h-1z"/>
        </svg>
      `;
      toggleButton.title = 'Restore';
    } else {
      toggleButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M3 3h3v1H4v2H3V3zm7 0h3v3h-1V4h-2V3zm-7 7v3h3v-1H4v-2H3zm10-2v2h-2v1h3V8h-1z"/>
        </svg>
      `;
      toggleButton.title = 'Maximize';
    }
  }

  // Toggle function
  function toggle(): void {
    isMaximized = !isMaximized;
    updateButtonIcon();
    
    emitEvent({
      type: 'toggle',
      panelId,
      isMaximized
    });

    if (isMaximized) {
      emitEvent({
        type: 'maximize',
        panelId,
        isMaximized
      });
    } else {
      emitEvent({
        type: 'restore',
        panelId,
        isMaximized
      });
    }
  }

  // Set maximized state
  function setMaximized(maximized: boolean): void {
    if (isMaximized !== maximized) {
      isMaximized = maximized;
      updateButtonIcon();
    }
  }

  // Button click handler
  toggleButton.addEventListener('click', (e) => {
    e.stopPropagation();
    toggle();
  });

  // Double-click handler for panel
  function handleDoubleClick(e: MouseEvent): void {
    if (enableDoubleClick && e.target === toggleContainer.parentElement) {
      e.preventDefault();
      toggle();
    }
  }

  // Add hover effects
  toggleButton.addEventListener('mouseenter', () => {
    toggleButton.style.background = theme === 'dark' 
      ? 'rgba(0, 0, 0, 0.8)' 
      : 'rgba(255, 255, 255, 1)';
  });

  toggleButton.addEventListener('mouseleave', () => {
    toggleButton.style.background = theme === 'dark' 
      ? 'rgba(0, 0, 0, 0.7)' 
      : 'rgba(255, 255, 255, 0.9)';
  });

  // Assemble toggle
  toggleContainer.appendChild(toggleButton);

  // Initialize button icon
  updateButtonIcon();

  // Add double-click listener to parent panel
  if (enableDoubleClick) {
    // We'll need to add this listener when the panel is created
    // For now, we'll provide a method to set it up
    const setupDoubleClick = (panelElement: HTMLElement) => {
      panelElement.addEventListener('dblclick', handleDoubleClick);
    };

    // Store the setup function for later use
    (toggleContainer as any).setupDoubleClick = setupDoubleClick;
  }

  // Destroy function
  function destroy(): void {
    toggleContainer.remove();
    eventListeners.clear();
  }

  return {
    element: toggleContainer,
    addEventListener,
    removeEventListener,
    setMaximized,
    destroy
  };
}

/**
 * Creates a fullscreen toggle that can be attached to any panel element
 * @param panelElement The panel element to attach the toggle to
 * @param panelId The panel ID
 * @param config Toggle configuration
 * @returns The toggle instance
 */
export function attachFullscreenToggle(
  panelElement: HTMLElement,
  panelId: string,
  config: FullscreenToggleConfig = {}
): ReturnType<typeof createFullscreenToggle> {
  const toggle = createFullscreenToggle(panelId, config);
  
  // Attach to panel
  panelElement.appendChild(toggle.element);
  
  // Setup double-click if enabled
  if (config.enableDoubleClick && (toggle.element as any).setupDoubleClick) {
    (toggle.element as any).setupDoubleClick(panelElement);
  }
  
  return toggle;
} 