/**
 * Ant Design global theme configuration
 * Tất cả customization AntD tập trung tại đây — không định nghĩa lại ở từng page/component
 *
 * Docs: https://ant.design/docs/react/customize-theme
 */
export const antdTheme = {
  token: {
    // Brand colors
    colorPrimary:       '#18181b',
    colorPrimaryHover:  '#27272a',
    colorPrimaryActive: '#3f3f46',
    colorLink:          '#c17c54',
    colorLinkHover:     '#a5623d',

    // Layout
    borderRadius:  10,
    controlHeight: 46,

    // Typography
    fontSize:   15,
    fontFamily: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,

    // Colors
    colorBorder:          '#e4e4e7',
    colorBorderSecondary: '#f4f4f5',
    colorText:            '#18181b',
    colorTextSecondary:   '#71717a',
    colorTextPlaceholder: '#d4d4d8',
    colorBgContainer:     '#ffffff',
    colorBgElevated:      '#ffffff',
    colorBgLayout:        '#f5f5f4',
    colorError:           '#ef4444',
    colorSuccess:         '#16a34a',
    colorWarning:         '#f59e0b',

    // Shadow
    boxShadowSecondary: '0 4px 24px rgba(0,0,0,0.08)',

    // Border
    lineWidth: 1.5,
  },

  components: {
    Input: {
      paddingInline:     14,
      paddingBlock:      11,
      activeBorderColor: '#c17c54',
      hoverBorderColor:  '#c17c54',
      activeShadow:      '0 0 0 3px rgba(193,124,84,0.12)',
      prefixColor:       '#a1a1aa',
      addonBg:           '#fafaf9',
    },
    Button: {
      primaryColor:      '#fafaf9',
      defaultBorderColor:'#e4e4e7',
      defaultColor:      '#52525b',
      borderRadius:       10,
      controlHeight:      46,
      fontWeight:         600,
    },
    Form: {
      labelColor:    '#3f3f46',
      labelFontSize:  13,
      itemMarginBottom: 20,
    },
    Checkbox: {
      colorPrimary:      '#c17c54',
      colorPrimaryHover: '#a5623d',
    },
    Menu: {
      darkItemBg:          '#18181b',
      darkSubMenuItemBg:   '#27272a',
      darkItemSelectedBg:  '#c17c54',
      darkItemHoverBg:     'rgba(255,255,255,0.06)',
      darkItemSelectedColor:'#ffffff',
    },
    Card: {
      borderRadius: 12,
      boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.05)',
    },
    Table: {
      borderRadius: 12,
      headerBg: '#fafaf9',
    },
    Modal: {
      borderRadius: 16,
    },
    Select: {
      optionSelectedBg: '#fdf3ed',
      optionSelectedColor: '#c17c54',
    },
    Tag: {
      borderRadius: 6,
    },
    Tabs: {
      inkBarColor: '#c17c54',
      itemSelectedColor: '#c17c54',
      itemHoverColor: '#a5623d',
    },
  },
}
