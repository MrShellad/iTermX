import { SettingItem } from "../types";

export const generalItems: SettingItem[] = [
  {
    id: 'general.language',
    categoryId: 'general',
    type: 'select',
    labelKey: 'settings.general.language',
    descKey: 'settings.general.languageDesc',
    defaultValue: 'auto',
    options: [
      { labelKey: 'settings.general.languageOptions.auto', value: 'auto' },
      { label: '简体中文', value: 'zh' },
      { label: '繁體中文', value: 'zhTW' },
      { label: 'English', value: 'en' },
      { label: '日本語', value: 'ja' },
      { label: 'Tiếng Việt', value: 'vi' },
    ]
  },
  // {
  //   id: 'general.launchAtStartup',
  //   categoryId: 'general',
  //   type: 'switch',
  //   labelKey: 'settings.general.launchAtStartup',
  //   descKey: 'settings.general.launchAtStartupDesc',
  //   defaultValue: false,
  // },
  // {
  //   id: 'general.minimizeToTray',
  //   categoryId: 'general',
  //   type: 'switch',
  //   labelKey: 'settings.general.minimizeToTray',
  //   descKey: 'settings.general.minimizeToTrayDesc',
  //   defaultValue: true,
  // },
  {
    id: 'general.closeBehavior',
    categoryId: 'general',
    type: 'select',
    labelKey: 'settings.general.closeBehavior',
    descKey: 'settings.general.closeBehaviorDesc',
    defaultValue: 'quit',
    options: [
        { labelKey: 'settings.general.behavior.quit', value: 'quit' },
        { labelKey: 'settings.general.behavior.minimize', value: 'minimize' }
    ]
  },
  {
    id: 'general.deviceName',
    categoryId: 'general',
    type: 'input',
    labelKey: 'settings.general.deviceName', 
    descKey: 'settings.general.deviceNameDesc', // 需翻译: "Used to identify backups from this device."
    defaultValue: 'I', 
  },
];