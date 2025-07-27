import type { CameraPreset } from './ViewportState.js';
import { getPresetDisplayName, getAllCameraPresets } from './CameraPresets.js';

/**
 * Menu configuration options
 */
export interface ViewportMenuConfig {
  /** Available camera presets */
  presets?: CameraPreset[];
  /** Menu position */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Menu theme */
  theme?: 'light' | 'dark';
  /** Whether to show preset icons */
  showIcons?: boolean;
  /** Custom CSS class for styling */
  className?: string;
}

/**
 * Menu event types
 */
export type MenuEventType = 'preset-selected' | 'menu-opened' | 'menu-closed';

/**
 * Menu event data
 */
export interface MenuEvent {
  type: MenuEventType;
  preset?: CameraPreset;
  panelId?: string;
}

/**
 * Menu event listener
 */
export type MenuEventListener = (event: MenuEvent) => void;

/**
 * Creates a hamburger menu for viewport camera switching
 * @param panelId The panel ID this menu belongs to
 * @param config Menu configuration
 * @returns The menu element and event emitter
 */
export function createViewportMenu(
  panelId: string,
  config: ViewportMenuConfig = {}
): {
  element: HTMLElement;
  addEventListener: (type: MenuEventType, listener: MenuEventListener) => void;
  removeEventListener: (type: MenuEventType, listener: MenuEventListener) => void;
  setPresets: (presets: CameraPreset[]) => void;
  destroy: () => void;
} {
  const {
    presets = getAllCameraPresets(),
    position = 'top-left',
    theme = 'dark',
    showIcons = true,
    className = ''
  } = config;

  // Create menu container
  const menuContainer = document.createElement('div');
  menuContainer.className = `viewport-menu ${className}`;
  menuContainer.style.cssText = `
    position: absolute;
    z-index: 1000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 12px;
    user-select: none;
  `;

  // Position the menu
  switch (position) {
    case 'top-left':
      menuContainer.style.top = '8px';
      menuContainer.style.left = '8px';
      break;
    case 'top-right':
      menuContainer.style.top = '8px';
      menuContainer.style.right = '8px';
      break;
    case 'bottom-left':
      menuContainer.style.bottom = '8px';
      menuContainer.style.left = '8px';
      break;
    case 'bottom-right':
      menuContainer.style.bottom = '8px';
      menuContainer.style.right = '8px';
      break;
  }

  // Create hamburger button
  const hamburgerButton = document.createElement('button');
  hamburgerButton.className = 'viewport-menu-button';
  hamburgerButton.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect x="2" y="4" width="12" height="1.5" rx="0.75"/>
      <rect x="2" y="7.25" width="12" height="1.5" rx="0.75"/>
      <rect x="2" y="10.5" width="12" height="1.5" rx="0.75"/>
    </svg>
  `;
  hamburgerButton.style.cssText = `
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

  // Create dropdown menu
  const dropdownMenu = document.createElement('div');
  dropdownMenu.className = 'viewport-menu-dropdown';
  dropdownMenu.style.cssText = `
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 4px;
    background: ${theme === 'dark' ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)'};
    border: 1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    min-width: 120px;
    display: none;
    flex-direction: column;
    backdrop-filter: blur(10px);
  `;

  // Event listeners storage
  const eventListeners = new Map<MenuEventType, Set<MenuEventListener>>();

  // Add event listener helper
  function addEventListener(type: MenuEventType, listener: MenuEventListener): void {
    if (!eventListeners.has(type)) {
      eventListeners.set(type, new Set());
    }
    eventListeners.get(type)!.add(listener);
  }

  // Remove event listener helper
  function removeEventListener(type: MenuEventType, listener: MenuEventListener): void {
    const listeners = eventListeners.get(type);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  // Emit event helper
  function emitEvent(event: MenuEvent): void {
    const listeners = eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => listener(event));
    }
  }

  // Create menu items
  function createMenuItems(presetList: CameraPreset[]): void {
    dropdownMenu.innerHTML = '';
    
    presetList.forEach(preset => {
      const menuItem = document.createElement('div');
      menuItem.className = 'viewport-menu-item';
      menuItem.style.cssText = `
        padding: 8px 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        color: ${theme === 'dark' ? '#ffffff' : '#000000'};
        transition: background-color 0.2s ease;
        border-bottom: 1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
      `;

      // Add icon if enabled
      if (showIcons) {
        const icon = document.createElement('span');
        icon.innerHTML = getPresetIcon(preset);
        icon.style.cssText = `
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
        `;
        menuItem.appendChild(icon);
      }

      // Add label
      const label = document.createElement('span');
      label.textContent = getPresetDisplayName(preset);
      menuItem.appendChild(label);

      // Add hover effect
      menuItem.addEventListener('mouseenter', () => {
        menuItem.style.backgroundColor = theme === 'dark' 
          ? 'rgba(255, 255, 255, 0.1)' 
          : 'rgba(0, 0, 0, 0.1)';
      });

      menuItem.addEventListener('mouseleave', () => {
        menuItem.style.backgroundColor = 'transparent';
      });

      // Add click handler
      menuItem.addEventListener('click', () => {
        emitEvent({
          type: 'preset-selected',
          preset,
          panelId
        });
        hideMenu();
      });

      dropdownMenu.appendChild(menuItem);
    });
  }

  // Show/hide menu
  let isMenuVisible = false;

  function showMenu(): void {
    dropdownMenu.style.display = 'flex';
    isMenuVisible = true;
    emitEvent({ type: 'menu-opened', panelId });
  }

  function hideMenu(): void {
    dropdownMenu.style.display = 'none';
    isMenuVisible = false;
    emitEvent({ type: 'menu-closed', panelId });
  }

  function toggleMenu(): void {
    if (isMenuVisible) {
      hideMenu();
    } else {
      showMenu();
    }
  }

  // Hamburger button click handler
  hamburgerButton.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!menuContainer.contains(e.target as Node)) {
      hideMenu();
    }
  });

  // Add hover effects to hamburger button
  hamburgerButton.addEventListener('mouseenter', () => {
    hamburgerButton.style.background = theme === 'dark' 
      ? 'rgba(0, 0, 0, 0.8)' 
      : 'rgba(255, 255, 255, 1)';
  });

  hamburgerButton.addEventListener('mouseleave', () => {
    hamburgerButton.style.background = theme === 'dark' 
      ? 'rgba(0, 0, 0, 0.7)' 
      : 'rgba(255, 255, 255, 0.9)';
  });

  // Assemble menu
  menuContainer.appendChild(hamburgerButton);
  menuContainer.appendChild(dropdownMenu);

  // Create initial menu items
  createMenuItems(presets);

  // Set presets function
  function setPresets(newPresets: CameraPreset[]): void {
    createMenuItems(newPresets);
  }

  // Destroy function
  function destroy(): void {
    menuContainer.remove();
    eventListeners.clear();
  }

  return {
    element: menuContainer,
    addEventListener,
    removeEventListener,
    setPresets,
    destroy
  };
}

/**
 * Gets the icon for a camera preset
 * @param preset The camera preset
 * @returns Icon HTML string
 */
function getPresetIcon(preset: CameraPreset): string {
  switch (preset) {
    case 'top':
      return '⬆️';
    case 'front':
      return '⬇️';
    case 'right':
      return '➡️';
    case 'left':
      return '⬅️';
    case 'back':
      return '⬆️';
    case 'bottom':
      return '⬇️';
    case 'perspective':
      return '🔍';
    case 'isometric':
      return '📐';
    default:
      return '👁️';
  }
} 