import { theme, type ThemeConfig } from 'antd';

export const logbookTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#65d6ad',
    colorInfo: '#65d6ad',
    colorBgBase: '#0b1015',
    colorBgContainer: '#121a22',
    colorBgElevated: '#18232d',
    colorBorder: '#3f5261',
    colorText: '#f2f6f8',
    colorTextSecondary: '#b4c2cb',
    borderRadius: 10,
    controlHeight: 44,
    fontSize: 16,
  },
  components: {
    Layout: { bodyBg: '#0b1015', headerBg: '#121a22', siderBg: '#121a22' },
    Menu: { darkItemBg: '#121a22', darkItemSelectedBg: '#17483b', itemHeight: 48 },
    Button: { controlHeight: 44 },
    Input: { controlHeight: 44 },
  },
};
